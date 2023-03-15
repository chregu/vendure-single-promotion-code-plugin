import { Customer, DeepPartial, Order, VendureEntity } from '@vendure/core'
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm'

@Entity()
export class SomecustomerPromotion extends VendureEntity {
    constructor(input?: DeepPartial<SomecustomerPromotion>) {
        super(input)
    }

    @Index({ unique: true })
    @Column({ nullable: false })
    code: string

    @Column({ default: null })
    validUntil?: Date

    @OneToOne(() => Order, { nullable: true })
    @JoinColumn()
    order?: Order | null

    @Index()
    @ManyToOne(() => Customer)
    customer?: Customer | null
}
