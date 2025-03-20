import { checkout } from './lib/yoo-checkout';
import { Injectable } from '@nestjs/common';
import { CreateCheckoutDTO, UpdateCheckoutDto } from './dto/create-checkout.dto';
import { ICreatePayment, IItemWithoutData  } from '@a2seven/yoo-checkout';
import { formatAmount } from "functions/format-amount"
import { PrismaService } from '@nash-vpn/db';

@Injectable()
export class CheckoutService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCheckoutDto: CreateCheckoutDTO) {
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
          type: createCheckoutDto.payment_method || "sbp"
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

      const payloadToFormat = {
        ...createCheckoutDto.payload,
        ts: Date.now() / 1000
      }

      const formattedPayload = Object.entries(payloadToFormat)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("&");

      const onSuccess = await checkout.createWebHook({
        event: 'payment.succeeded',
        url: `${process.env.PROJECT_URL}/bot/hook/send-config?${formattedPayload}`
      })

      // const onCancel = await checkout.createWebHook({
      //   event: 'payment.canceled',
      //   url: `${process.env.PROJECT_URL}/api/v1/checkout/hook/cancel${formattedPayload}`
      // })

      // console.log({onCancel})

      // const onWaiting = await checkout.createWebHook({
      //   event: 'payment.waiting_for_capture',
      //   url: `${process.env.PROJECT_URL}/api/v1/checkout/hook/waiting${formattedPayload}`
      // })

      // console.log({onWaiting})

      const data = await this.prisma.invoice.create({
        data: {
          id: payment.id,
          amount: Number(payment.amount.value),
          webhookId: onSuccess.id,
          status: payment.status,
          paid: payment.paid,
          confirmation_url: payment.confirmation.confirmation_url,
        }
      });

      console.log({ data })

      return {
        payment,
        data,
        onSuccess,
        // onCancel,
        // onWaiting
      }
    } catch (e) {
      console.error(e)
      return e
    }
  }

  async deleteHookById(id: string) {
    console.log({ deleteHookById: id })
    try {
      await checkout.deleteWebHook(id)
      return {
        message: "webhook deleted",
        success: true
      }
    } catch (error) {
      return {
        message: "error deleting webhook :(",
        success: false,
        error
      }
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
    return this.prisma.invoice.findUnique({ where: { id } })
  }

  async update(id: string, dto: Partial<UpdateCheckoutDto>) {
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
