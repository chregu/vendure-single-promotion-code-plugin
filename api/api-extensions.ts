import gql from 'graphql-tag'

export const shopApiExtensions = gql`
    type SomecustomerPromotionType {
        code: String
        used: String
        order: Order
    }

    type UpdateSomecustomerPromotion {
        status: String
        somecustomerPromotion: SomecustomerPromotionType
    }
    extend type Query {
        activeCustomerSomecustomerPromotion: SomecustomerPromotionType
    }
    extend type Customer {
        somecustomerPromotion: SomecustomerPromotionType
    }

    extend type Mutation {
        updateCustomerSomecustomerPromotion(code: String!): UpdateSomecustomerPromotion
    }
`
