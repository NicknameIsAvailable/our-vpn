import { checkout } from './lib/yoo-checkout';
import { Injectable } from '@nestjs/common';
import { CreateCheckoutDTO } from './dto/create-checkout.dto';
import { ICreatePayment, IItemWithoutData  } from '@a2seven/yoo-checkout';
import { formatAmount } from "functions/format-amount"
import { PrismaService } from '@nash-vpn/db';

@Injectable()
export class CheckoutService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCheckoutDto: CreateCheckoutDTO) {
    console.log({ createCheckoutDto })

    const formattedItems: IItemWithoutData[] = createCheckoutDto.items.map((item) => ({
      ...item,
      amount: {
        value: String(Number(formatAmount(item.amount))),
        currency: "RUB"
      },
      payment_subject: "service",
      payment_mode: "full_payment",
      vat_code: 1,
      quantity: "1",
    }));

    const payload: ICreatePayment = {
      amount: {
        value: formatAmount(createCheckoutDto.amount),
        currency: 'RUB'
      },
      payment_method_data: {
          type: 'sbp'
      },
      capture: true,
      receipt: {
        items: formattedItems,
        customer: {
          full_name: createCheckoutDto.username,
          email: createCheckoutDto.email
        },
      },
      confirmation: {
          type: 'redirect',
          return_url: 'test'
      }
    }

    try {
      const payment = await checkout.createPayment(payload, createCheckoutDto.idempotence_key)
      console.log({ payment })

      const data = await this.prisma.invoice.create({
        data: {
          id: payment.id,
          amount: Number(payment.amount.value),
          status: payment.status,
          paid: payment.paid,
          confirmation_url: payment.confirmation.confirmation_url,
        }
      });

      const formattedPayload = Object.entries(createCheckoutDto.payload)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("&");

      const onSuccess = await checkout.createWebHook({
        event: 'payment.succeeded',
        url: `${process.env.PROJECT_URL}/bot/hook/send-config${formattedPayload}`
      })

      const onCancel = await checkout.createWebHook({
        event: 'payment.canceled',
        url: `${process.env.PROJECT_URL}/api/v1/checkout/hook/cancel${formattedPayload}`
      })

      const onWaiting = await checkout.createWebHook({
        event: 'payment.waiting_for_capture',
        url: `${process.env.PROJECT_URL}/api/v1/checkout/hook/waiting${formattedPayload}`
      })

      return {
        payment,
        data,
        onSuccess,
        onCancel,
        onWaiting
      }
    } catch (e) {
      console.error(e)
      return e
    }
  }

  async findMany(filters: Partial<CreateCheckoutDTO>) {
    return this.prisma.invoice.findMany({
      where: {
        ...filters
      }
    });
  }

  async findById(id: string) {
    const payment = await checkout.getPayment(id)
    const entity = await this.prisma.invoice.update({
      where: {id},
      data: {
        amount: Number(payment.amount.value),
        status: payment.status,
        paid: payment.paid,
        confirmation_url: payment.confirmation.confirmation_url
      },
    })

    return { data: payment, entity }
  }

  async update(id: string, dto: Partial<CreateCheckoutDTO>) {
    return this.prisma.invoice.update({
      where: { id },
      data: dto
    });
  }

  async deleteById(id: string) {
    const payment = await checkout.cancelPayment(id)
    const entity = await this.prisma.invoice.delete({
      where: { id }
    })

    return { payment, entity };
  }
}
