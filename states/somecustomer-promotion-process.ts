import { CustomerService, CustomOrderProcess, OrderState } from '@vendure/core'

import { MailService } from '../../somecustomer-utilities/service/mail-service'
import { SomecustomerLogger } from '../../somecustomer-utilities/service/somecustomer-logger.service'
import { SomecustomerPromotionService } from '../service/somecustomer-promotion-service'

let logger: SomecustomerLogger
let somecustomerPromotionService: SomecustomerPromotionService
let customerService: CustomerService

export const somecustomerPromotionProcess: CustomOrderProcess<OrderState> = {
    // The init method allows us to inject services
    // and other providers

    init(injector) {
        logger = new SomecustomerLogger(injector.get(MailService))
        somecustomerPromotionService = injector.get(SomecustomerPromotionService)
        customerService = injector.get(CustomerService)
    },

    // The logic for enforcing our validation goes here
    async onTransitionEnd(fromState, toState, data) {
        if (toState === 'PaymentAuthorized' || toState === 'PaymentSettled') {
            // set somecustomer order to used in this stage, when we have one
            // and wasn't used yet
            if (
                !data.order.customer?.customFields.somecustomerPromotionUsed &&
                data.order.customer?.customFields.somecustomerPromotionCode &&
                data.order.discounts.length > 0
            ) {
                const promotion = await somecustomerPromotionService.findOne(
                    data.ctx,
                    data.order.customer?.customFields.somecustomerPromotionCode,
                )
                // code was used, mark it to the customer
                if (promotion && promotion.order?.id === data.order.id) {
                    const customer = data.order.customer
                    logger.debug(`Customer ${customer.emailAddress} used somecustomer code ${promotion.code}`)
                    await customerService.update(data.ctx, {
                        id: data.order.customer.id,
                        customFields: { somecustomerPromotionUsed: new Date() },
                    })
                }
            }
        }
    },
}
