import { PluginCommonModule, VendurePlugin } from '@vendure/core'

import { SomecustomerUtilitiesPlugin } from '../somecustomer-utilities/utilities-plugin'
import { shopApiExtensions } from './api/api-extensions'
import { SomecustomerPromotion } from './entitities/somecustomer-promotion.entity'
import { CustomerResolver } from './resolvers/customer-resolver'
import { PromotionResolver } from './resolvers/promotion-resolver'
import { SomecustomerPromotionService } from './service/somecustomer-promotion-service'

@VendurePlugin({
    imports: [PluginCommonModule, SomecustomerUtilitiesPlugin],
    entities: [SomecustomerPromotion],
    providers: [SomecustomerPromotionService],
    shopApiExtensions: {
        schema: shopApiExtensions,
        resolvers: [PromotionResolver, CustomerResolver],
    },
})
export class SomecustomerPromotionPlugin {}
