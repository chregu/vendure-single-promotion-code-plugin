import { LanguageCode, PromotionCondition, PromotionOrderAction } from '@vendure/core'

import { SomecustomerPromotionService } from '../service/somecustomer-promotion-service'
let somecustomerPromotionService: SomecustomerPromotionService

export const somecustomerPromotionCondition = new PromotionCondition({
    /** A unique identifier for the condition */
    code: 'somecustomer',
    init(injector) {
        somecustomerPromotionService = injector.get(SomecustomerPromotionService)
    },
    /**
     * A human-readable description. Values defined in the
     * `args` object can be interpolated using the curly-braces syntax.
     */
    description: [{ languageCode: LanguageCode.en, value: 'somecustomer promotion' }],

    /**
     * Arguments which can be specified when configuring the condition
     * in the Admin UI. The values of these args are then available during
     * the execution of the `check` function.
     */
    args: {},

    /**
     * This is the business logic of the condition. It is a function that
     * must resolve to a boolean value indicating whether the condition has
     * been satisfied.
     */
    async check(ctx, order) {
        // if customer has no code, not applicable
        if (!order.customer?.customFields.somecustomerPromotionCode) {
            return false
        }

        // if already used...
        if (order.customer?.customFields.somecustomerPromotionUsed) {
            return false
        }
        return somecustomerPromotionService.checkIfCodeCanBeUsed(
            ctx,
            order.customer?.customFields.somecustomerPromotionCode,
            order,
        )
    },
})

export const somecustomerPromotionAction = new PromotionOrderAction({
    // See the custom condition example above for explanations
    // of code, description & args fields.
    code: 'somecustomer',
    description: [{ languageCode: LanguageCode.en, value: '10.- somecustomer offer' }],
    args: {},
    init(injector) {
        somecustomerPromotionService = injector.get(SomecustomerPromotionService)
    },
    /**
     * This is the function that defines the actual amount to be discounted.
     * It should return a negative number representing the discount in
     * pennies/cents etc. Rounding to an integer is handled automatically.
     */
    execute() {
        return -10 * 100 //10 Franken Rabatt
    },
    conditions: [somecustomerPromotionCondition],
    onActivate: async (ctx, order) => {
        if (!order.customer?.customFields.somecustomerPromotionCode) {
            return
        }
        const promotion = await somecustomerPromotionService.findOne(
            ctx,
            order.customer?.customFields.somecustomerPromotionCode,
        )
        if (promotion && promotion?.order?.id !== order.id) {
            await somecustomerPromotionService.update(ctx, { ...promotion, order: order })
        }
    },
    onDeactivate: async (ctx, order) => {
        if (!order.customer?.customFields.somecustomerPromotionCode) {
            return
        }
        const promotion = await somecustomerPromotionService.findOne(
            ctx,
            order.customer?.customFields.somecustomerPromotionCode,
        )
        if (promotion && promotion?.order?.id !== null) {
            await somecustomerPromotionService.update(ctx, { ...promotion, order: null })
        }
    },
})
