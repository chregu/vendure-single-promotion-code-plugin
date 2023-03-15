import { Injectable } from '@nestjs/common'
import {
    Customer,
    CustomerService,
    LanguageCode,
    Order,
    OrderService,
    RequestContext,
    TransactionalConnection,
} from '@vendure/core'

import { t } from '../../somecustomer-utilities/helpers'
import { CacheService } from '../../somecustomer-utilities/service/cache-service'
import { SomecustomerLogger } from '../../somecustomer-utilities/service/Somecustomer-logger.service'
import { Order as OrderType, UpdateSomecustomerPromotion, SomecustomerPromotionType } from '../../pages/ui/generated/shop-types'
import { Discount } from '../../pages/ui/generated/ui-types'
import { SomecustomerPromotion } from '../entitities/somecustomer-promotion.entity'

@Injectable()
export class SomecustomerPromotionService {
    constructor(
        private connection: TransactionalConnection,
        private customerService: CustomerService,
        private orderService: OrderService,
        private logger: SomecustomerLogger,
        private cacheService: CacheService,
    ) {
        this.logger.setContext(SomecustomerPromotionService.name)
    }

    public async findOne(
        ctx: RequestContext,
        code: string,
        relations = ['order'],
    ): Promise<SomecustomerPromotion | undefined> {
        return this.getRepository(ctx).findOne({ code }, { relations })
    }

    public async update(ctx: RequestContext, somecustomerPromotion: SomecustomerPromotion) {
        return this.getRepository(ctx).update({ id: somecustomerPromotion.id }, somecustomerPromotion)
    }

    public getPromotionInfo(customer: Customer): SomecustomerPromotionType {
        return {
            code: customer.customFields.somecustomerPromotionCode || undefined,
            used: customer.customFields.somecustomerPromotionUsed?.toISOString() || undefined,
        }
    }

    public async getOrderForCode(ctx: RequestContext, code?: string | null) {
        if (!code) {
            return null
        }
        const promotion = await this.findOne(ctx, code)
        if (!promotion?.order) {
            return null
        }
        return (await this.orderService.findOne(ctx, promotion?.order.id)) as OrderType
    }

    public async updateCode(ctx: RequestContext, customer: Customer, code: string): Promise<UpdateSomecustomerPromotion> {
        const currentCode = customer.customFields.somecustomerPromotionCode

        code = code.toUpperCase()
        if (currentCode === code) {
            return { status: 'same_code', somecustomerPromotion: this.getPromotionInfo(customer) }
        }
        const promotion = await this.findOne(ctx, code, ['order', 'customer'])
        // if promotion was not found, just send back the current one
        if (!promotion) {
            return { status: 'not_found', somecustomerPromotion: this.getPromotionInfo(customer) }
        }
        // if promotion already has an order, we can't update it
        if (promotion.order) {
            return { status: 'already_used_in_order', somecustomerPromotion: this.getPromotionInfo(customer) }
        }

        if (promotion.customer) {
            return { status: 'already_used_by_another_customer', somecustomerPromotion: this.getPromotionInfo(customer) }
        }

        await this.update(ctx, { ...promotion, customer })
        // if old promotion was not used, set it free.
        if (currentCode) {
            const oldPromotion = await this.findOne(ctx, currentCode)
            if (oldPromotion && !oldPromotion?.order) {
                await this.update(ctx, {
                    ...oldPromotion,
                    customer: null,
                })
            }
        }
        // asign promotion to this customer
        await this.update(ctx, { ...promotion, customer })
        // update customFields for promotion in Customer
        const newCustomer = await this.customerService.update(ctx, {
            id: customer.id,
            customFields: { somecustomerPromotionCode: code, somecustomerPromotionUsed: null },
        })

        return { status: 'OK', somecustomerPromotion: this.getPromotionInfo(newCustomer) }
    }

    public translateDiscounts(discounts: Discount[], languageCode: LanguageCode) {
        if (!discounts) {
            return []
        }

        return discounts.map(discount => {
            if (discount.description === 'somecustomer-promotion') {
                discount.description = t(`promotions.${discount.description}`, languageCode)
            }
            return discount
        })
    }

    public async checkIfCodeCanBeUsed(ctx: RequestContext, code: string, order: Order) {
        const checkCode = async () => {
            const promotion = await this.findOne(ctx, code)

            if (!promotion) {
                return false
            }

            if (promotion.validUntil && promotion.validUntil < new Date()) {
                return false
            }

            // if it was not used yet, it's applicable
            if (!promotion.order) {
                return true
            }

            // if it was used on another order, which was not cancelled... then no dice
            if (promotion.order.id !== order.id && promotion.order.state !== 'Cancelled') {
                return false
            }
            // otherwise we're fine
            return true
        }

        const key = `somecustomerpromotion:${code}:${order.id}`
        // vendure seems to call this function several times, so we cache it for a few seconds
        return this.cacheService.wrap<boolean>(key, checkCode, { ttl: 3 })
    }

    private getRepository(ctx: RequestContext) {
        return this.connection.getRepository(ctx, SomecustomerPromotion)
    }
}
