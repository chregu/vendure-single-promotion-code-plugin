import { Parent, ResolveField, Resolver } from '@nestjs/graphql'
import { Ctx, Customer, RequestContext } from '@vendure/core'

import { SomecustomerPromotionService } from '../service/somecustomer-promotion-service'

@Resolver('Customer')
export class CustomerResolver {
    constructor(private somecustomerPromotionService: SomecustomerPromotionService) {}

    @ResolveField()
    async somecustomerPromotion(@Ctx() ctx: RequestContext, @Parent() customer: Customer) {
        return this.somecustomerPromotionService.getPromotionInfo(customer)
    }
}
