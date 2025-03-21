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
          type: createCheckoutDto.paymentMethod
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

      const data = await this.prisma.invoice.create({
        data: {
          id: payment.id,
          amount: Number(payment.amount.value),
          status: payment.status,
          paid: payment.paid,
          confirmation_url: payment.confirmation.confirmation_url,
        }
      });

      return {
        payment,
        data
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
    const entity = await checkout.getPayment(id)

    const data = await this.prisma.invoice.update({
      data: {
        status: entity.status,
        paid: entity.paid,
      },
      where: {
        id
      }
    })

    return {
      data,
      entity
    }
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
