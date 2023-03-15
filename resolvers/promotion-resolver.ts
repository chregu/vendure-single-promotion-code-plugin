import { UnauthorizedException } from '@nestjs/common'
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql'
import { Allow, Ctx, CustomerService, Permission, RequestContext, Transaction } from '@vendure/core'

import { SomecustomerPromotionType } from '../../pages/ui/generated/shop-types'
import { SomecustomerPromotionService } from '../service/somecustomer-promotion-service'

@Resolver('SomecustomerPromotionType')
export class PromotionResolver {
    constructor(private customerService: CustomerService, private somecustomerPromotionService: SomecustomerPromotionService) {}

    @Query()
    @Allow(Permission.Authenticated)
    async activeCustomerSomecustomerPromotion(@Ctx() ctx: RequestContext) {
        if (!ctx.activeUserId) {
            throw new UnauthorizedException()
        }
        const customer = await this.customerService.findOneByUserId(ctx, ctx.activeUserId)
        if (!customer) {
            throw new UnauthorizedException()
        }
        return this.somecustomerPromotionService.getPromotionInfo(customer)
    }

    @ResolveField('order')
    async order(@Ctx() ctx: RequestContext, @Parent() somecustomerPromotion: SomecustomerPromotionType) {
        return this.somecustomerPromotionService.getOrderForCode(ctx, somecustomerPromotion.code)
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Authenticated)
    async updateCustomerSomecustomerPromotion(@Ctx() ctx: RequestContext, @Args('code') code: string) {
        if (!ctx.activeUserId) {
            throw new UnauthorizedException()
        }
        const customer = await this.customerService.findOneByUserId(ctx, ctx.activeUserId)
        if (!customer) {
            throw new UnauthorizedException()
        }
        return this.somecustomerPromotionService.updateCode(ctx, customer, code)
    }
}
