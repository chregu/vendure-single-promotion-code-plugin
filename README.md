# Code for single use promotion codes in vendure

Doesn't work out of the box, but may give some idea how to do it.

Move the code into a plugin directory in vendure.

Fill your codes into the SomecustomerPromotion table manually.

And then adjust the code until it works ;)

If someone wants to make a "out of the box" working plugin out of this, feel free to take it over.

Also add this to your vendure-config.ts

```
promotionOptions: {
        promotionConditions: [somecustomerPromotionCondition, ...defaultPromotionConditions],
        promotionActions: [somecustomerPromotionAction, ...defaultPromotionActions],
    },
```

Inspired from this

https://vendure-ecommerce.slack.com/archives/CKYMF0ZTJ/p1674654273211489?thread_ts=1674653027.893989&cid=CKYMF0ZTJ

The graphQL API is in `api/api-extensions.ts`

Question:
```
Currently in Vendure that would be generating Promotions en-masse. 
Though, when browsing in the admin panel I guess these would all show up 
and clutter the view of the regular promotions.

1. Is there the possibility of excluding Promotions (which have a specific customField value, e.g.) 
   from the admin list view of the promotions page? How would one tackle this?

2. Say we would let the coupons live in a different service.
   Is there currently a way of hooking into the validation of coupons/promotions 
   so we could make a call to an external service which would validate the code 
   and return the response? Ifso, how would one tackle that?
```
Answer:
```
So I'd strongly recommend against generating 10k Promotions. The reason is that 
every time you modify an order (add an item, change quantity etc), the order 
calculator will have to loop over all 10k promotions to check eligibility.
Plus it clutters up the list as you mentioned.
Rather, I'd suggest you define a custom entity to represent the individual coupon, 
and then create a custom PromotionCondition which is able to look up this list 
to verify whether the promotion is applicable to the current order.

So:

1. no

2. Yes, a custom PromotionCondition can be async and can perform any logic it likes. Note that, as mentioned, the check function is executed frequently so it might make sense to e.g. cache data from the external service periodically to avoid network latency on every order modification.
```

