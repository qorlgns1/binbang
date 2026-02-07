import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
/**
 * Model PlatformSelector
 *
 */
export type PlatformSelectorModel = runtime.Types.Result.DefaultSelection<Prisma.$PlatformSelectorPayload>;
export type AggregatePlatformSelector = {
    _count: PlatformSelectorCountAggregateOutputType | null;
    _avg: PlatformSelectorAvgAggregateOutputType | null;
    _sum: PlatformSelectorSumAggregateOutputType | null;
    _min: PlatformSelectorMinAggregateOutputType | null;
    _max: PlatformSelectorMaxAggregateOutputType | null;
};
export type PlatformSelectorAvgAggregateOutputType = {
    priority: number | null;
};
export type PlatformSelectorSumAggregateOutputType = {
    priority: number | null;
};
export type PlatformSelectorMinAggregateOutputType = {
    id: string | null;
    platform: $Enums.Platform | null;
    category: $Enums.SelectorCategory | null;
    name: string | null;
    selector: string | null;
    extractorCode: string | null;
    priority: number | null;
    isActive: boolean | null;
    description: string | null;
    createdById: string | null;
    updatedById: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type PlatformSelectorMaxAggregateOutputType = {
    id: string | null;
    platform: $Enums.Platform | null;
    category: $Enums.SelectorCategory | null;
    name: string | null;
    selector: string | null;
    extractorCode: string | null;
    priority: number | null;
    isActive: boolean | null;
    description: string | null;
    createdById: string | null;
    updatedById: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type PlatformSelectorCountAggregateOutputType = {
    id: number;
    platform: number;
    category: number;
    name: number;
    selector: number;
    extractorCode: number;
    priority: number;
    isActive: number;
    description: number;
    createdById: number;
    updatedById: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type PlatformSelectorAvgAggregateInputType = {
    priority?: true;
};
export type PlatformSelectorSumAggregateInputType = {
    priority?: true;
};
export type PlatformSelectorMinAggregateInputType = {
    id?: true;
    platform?: true;
    category?: true;
    name?: true;
    selector?: true;
    extractorCode?: true;
    priority?: true;
    isActive?: true;
    description?: true;
    createdById?: true;
    updatedById?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type PlatformSelectorMaxAggregateInputType = {
    id?: true;
    platform?: true;
    category?: true;
    name?: true;
    selector?: true;
    extractorCode?: true;
    priority?: true;
    isActive?: true;
    description?: true;
    createdById?: true;
    updatedById?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type PlatformSelectorCountAggregateInputType = {
    id?: true;
    platform?: true;
    category?: true;
    name?: true;
    selector?: true;
    extractorCode?: true;
    priority?: true;
    isActive?: true;
    description?: true;
    createdById?: true;
    updatedById?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type PlatformSelectorAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which PlatformSelector to aggregate.
     */
    where?: Prisma.PlatformSelectorWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PlatformSelectors to fetch.
     */
    orderBy?: Prisma.PlatformSelectorOrderByWithRelationInput | Prisma.PlatformSelectorOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.PlatformSelectorWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PlatformSelectors from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PlatformSelectors.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned PlatformSelectors
    **/
    _count?: true | PlatformSelectorCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: PlatformSelectorAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: PlatformSelectorSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: PlatformSelectorMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: PlatformSelectorMaxAggregateInputType;
};
export type GetPlatformSelectorAggregateType<T extends PlatformSelectorAggregateArgs> = {
    [P in keyof T & keyof AggregatePlatformSelector]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregatePlatformSelector[P]> : Prisma.GetScalarType<T[P], AggregatePlatformSelector[P]>;
};
export type PlatformSelectorGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PlatformSelectorWhereInput;
    orderBy?: Prisma.PlatformSelectorOrderByWithAggregationInput | Prisma.PlatformSelectorOrderByWithAggregationInput[];
    by: Prisma.PlatformSelectorScalarFieldEnum[] | Prisma.PlatformSelectorScalarFieldEnum;
    having?: Prisma.PlatformSelectorScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: PlatformSelectorCountAggregateInputType | true;
    _avg?: PlatformSelectorAvgAggregateInputType;
    _sum?: PlatformSelectorSumAggregateInputType;
    _min?: PlatformSelectorMinAggregateInputType;
    _max?: PlatformSelectorMaxAggregateInputType;
};
export type PlatformSelectorGroupByOutputType = {
    id: string;
    platform: $Enums.Platform;
    category: $Enums.SelectorCategory;
    name: string;
    selector: string;
    extractorCode: string | null;
    priority: number;
    isActive: boolean;
    description: string | null;
    createdById: string | null;
    updatedById: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: PlatformSelectorCountAggregateOutputType | null;
    _avg: PlatformSelectorAvgAggregateOutputType | null;
    _sum: PlatformSelectorSumAggregateOutputType | null;
    _min: PlatformSelectorMinAggregateOutputType | null;
    _max: PlatformSelectorMaxAggregateOutputType | null;
};
type GetPlatformSelectorGroupByPayload<T extends PlatformSelectorGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<PlatformSelectorGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof PlatformSelectorGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], PlatformSelectorGroupByOutputType[P]> : Prisma.GetScalarType<T[P], PlatformSelectorGroupByOutputType[P]>;
}>>;
export type PlatformSelectorWhereInput = {
    AND?: Prisma.PlatformSelectorWhereInput | Prisma.PlatformSelectorWhereInput[];
    OR?: Prisma.PlatformSelectorWhereInput[];
    NOT?: Prisma.PlatformSelectorWhereInput | Prisma.PlatformSelectorWhereInput[];
    id?: Prisma.StringFilter<"PlatformSelector"> | string;
    platform?: Prisma.EnumPlatformFilter<"PlatformSelector"> | $Enums.Platform;
    category?: Prisma.EnumSelectorCategoryFilter<"PlatformSelector"> | $Enums.SelectorCategory;
    name?: Prisma.StringFilter<"PlatformSelector"> | string;
    selector?: Prisma.StringFilter<"PlatformSelector"> | string;
    extractorCode?: Prisma.StringNullableFilter<"PlatformSelector"> | string | null;
    priority?: Prisma.IntFilter<"PlatformSelector"> | number;
    isActive?: Prisma.BoolFilter<"PlatformSelector"> | boolean;
    description?: Prisma.StringNullableFilter<"PlatformSelector"> | string | null;
    createdById?: Prisma.StringNullableFilter<"PlatformSelector"> | string | null;
    updatedById?: Prisma.StringNullableFilter<"PlatformSelector"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"PlatformSelector"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"PlatformSelector"> | Date | string;
    createdBy?: Prisma.XOR<Prisma.UserNullableScalarRelationFilter, Prisma.UserWhereInput> | null;
    updatedBy?: Prisma.XOR<Prisma.UserNullableScalarRelationFilter, Prisma.UserWhereInput> | null;
};
export type PlatformSelectorOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    platform?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    selector?: Prisma.SortOrder;
    extractorCode?: Prisma.SortOrderInput | Prisma.SortOrder;
    priority?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdById?: Prisma.SortOrderInput | Prisma.SortOrder;
    updatedById?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    createdBy?: Prisma.UserOrderByWithRelationInput;
    updatedBy?: Prisma.UserOrderByWithRelationInput;
};
export type PlatformSelectorWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    platform_category_name?: Prisma.PlatformSelectorPlatformCategoryNameCompoundUniqueInput;
    AND?: Prisma.PlatformSelectorWhereInput | Prisma.PlatformSelectorWhereInput[];
    OR?: Prisma.PlatformSelectorWhereInput[];
    NOT?: Prisma.PlatformSelectorWhereInput | Prisma.PlatformSelectorWhereInput[];
    platform?: Prisma.EnumPlatformFilter<"PlatformSelector"> | $Enums.Platform;
    category?: Prisma.EnumSelectorCategoryFilter<"PlatformSelector"> | $Enums.SelectorCategory;
    name?: Prisma.StringFilter<"PlatformSelector"> | string;
    selector?: Prisma.StringFilter<"PlatformSelector"> | string;
    extractorCode?: Prisma.StringNullableFilter<"PlatformSelector"> | string | null;
    priority?: Prisma.IntFilter<"PlatformSelector"> | number;
    isActive?: Prisma.BoolFilter<"PlatformSelector"> | boolean;
    description?: Prisma.StringNullableFilter<"PlatformSelector"> | string | null;
    createdById?: Prisma.StringNullableFilter<"PlatformSelector"> | string | null;
    updatedById?: Prisma.StringNullableFilter<"PlatformSelector"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"PlatformSelector"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"PlatformSelector"> | Date | string;
    createdBy?: Prisma.XOR<Prisma.UserNullableScalarRelationFilter, Prisma.UserWhereInput> | null;
    updatedBy?: Prisma.XOR<Prisma.UserNullableScalarRelationFilter, Prisma.UserWhereInput> | null;
}, "id" | "platform_category_name">;
export type PlatformSelectorOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    platform?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    selector?: Prisma.SortOrder;
    extractorCode?: Prisma.SortOrderInput | Prisma.SortOrder;
    priority?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdById?: Prisma.SortOrderInput | Prisma.SortOrder;
    updatedById?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.PlatformSelectorCountOrderByAggregateInput;
    _avg?: Prisma.PlatformSelectorAvgOrderByAggregateInput;
    _max?: Prisma.PlatformSelectorMaxOrderByAggregateInput;
    _min?: Prisma.PlatformSelectorMinOrderByAggregateInput;
    _sum?: Prisma.PlatformSelectorSumOrderByAggregateInput;
};
export type PlatformSelectorScalarWhereWithAggregatesInput = {
    AND?: Prisma.PlatformSelectorScalarWhereWithAggregatesInput | Prisma.PlatformSelectorScalarWhereWithAggregatesInput[];
    OR?: Prisma.PlatformSelectorScalarWhereWithAggregatesInput[];
    NOT?: Prisma.PlatformSelectorScalarWhereWithAggregatesInput | Prisma.PlatformSelectorScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"PlatformSelector"> | string;
    platform?: Prisma.EnumPlatformWithAggregatesFilter<"PlatformSelector"> | $Enums.Platform;
    category?: Prisma.EnumSelectorCategoryWithAggregatesFilter<"PlatformSelector"> | $Enums.SelectorCategory;
    name?: Prisma.StringWithAggregatesFilter<"PlatformSelector"> | string;
    selector?: Prisma.StringWithAggregatesFilter<"PlatformSelector"> | string;
    extractorCode?: Prisma.StringNullableWithAggregatesFilter<"PlatformSelector"> | string | null;
    priority?: Prisma.IntWithAggregatesFilter<"PlatformSelector"> | number;
    isActive?: Prisma.BoolWithAggregatesFilter<"PlatformSelector"> | boolean;
    description?: Prisma.StringNullableWithAggregatesFilter<"PlatformSelector"> | string | null;
    createdById?: Prisma.StringNullableWithAggregatesFilter<"PlatformSelector"> | string | null;
    updatedById?: Prisma.StringNullableWithAggregatesFilter<"PlatformSelector"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"PlatformSelector"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"PlatformSelector"> | Date | string;
};
export type PlatformSelectorCreateInput = {
    id?: string;
    platform: $Enums.Platform;
    category: $Enums.SelectorCategory;
    name: string;
    selector: string;
    extractorCode?: string | null;
    priority?: number;
    isActive?: boolean;
    description?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    createdBy?: Prisma.UserCreateNestedOneWithoutCreatedSelectorsInput;
    updatedBy?: Prisma.UserCreateNestedOneWithoutUpdatedSelectorsInput;
};
export type PlatformSelectorUncheckedCreateInput = {
    id?: string;
    platform: $Enums.Platform;
    category: $Enums.SelectorCategory;
    name: string;
    selector: string;
    extractorCode?: string | null;
    priority?: number;
    isActive?: boolean;
    description?: string | null;
    createdById?: string | null;
    updatedById?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PlatformSelectorUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    platform?: Prisma.EnumPlatformFieldUpdateOperationsInput | $Enums.Platform;
    category?: Prisma.EnumSelectorCategoryFieldUpdateOperationsInput | $Enums.SelectorCategory;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    selector?: Prisma.StringFieldUpdateOperationsInput | string;
    extractorCode?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    priority?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdBy?: Prisma.UserUpdateOneWithoutCreatedSelectorsNestedInput;
    updatedBy?: Prisma.UserUpdateOneWithoutUpdatedSelectorsNestedInput;
};
export type PlatformSelectorUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    platform?: Prisma.EnumPlatformFieldUpdateOperationsInput | $Enums.Platform;
    category?: Prisma.EnumSelectorCategoryFieldUpdateOperationsInput | $Enums.SelectorCategory;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    selector?: Prisma.StringFieldUpdateOperationsInput | string;
    extractorCode?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    priority?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdById?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    updatedById?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PlatformSelectorCreateManyInput = {
    id?: string;
    platform: $Enums.Platform;
    category: $Enums.SelectorCategory;
    name: string;
    selector: string;
    extractorCode?: string | null;
    priority?: number;
    isActive?: boolean;
    description?: string | null;
    createdById?: string | null;
    updatedById?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PlatformSelectorUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    platform?: Prisma.EnumPlatformFieldUpdateOperationsInput | $Enums.Platform;
    category?: Prisma.EnumSelectorCategoryFieldUpdateOperationsInput | $Enums.SelectorCategory;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    selector?: Prisma.StringFieldUpdateOperationsInput | string;
    extractorCode?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    priority?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PlatformSelectorUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    platform?: Prisma.EnumPlatformFieldUpdateOperationsInput | $Enums.Platform;
    category?: Prisma.EnumSelectorCategoryFieldUpdateOperationsInput | $Enums.SelectorCategory;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    selector?: Prisma.StringFieldUpdateOperationsInput | string;
    extractorCode?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    priority?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdById?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    updatedById?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PlatformSelectorListRelationFilter = {
    every?: Prisma.PlatformSelectorWhereInput;
    some?: Prisma.PlatformSelectorWhereInput;
    none?: Prisma.PlatformSelectorWhereInput;
};
export type PlatformSelectorOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type PlatformSelectorPlatformCategoryNameCompoundUniqueInput = {
    platform: $Enums.Platform;
    category: $Enums.SelectorCategory;
    name: string;
};
export type PlatformSelectorCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    platform?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    selector?: Prisma.SortOrder;
    extractorCode?: Prisma.SortOrder;
    priority?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    createdById?: Prisma.SortOrder;
    updatedById?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type PlatformSelectorAvgOrderByAggregateInput = {
    priority?: Prisma.SortOrder;
};
export type PlatformSelectorMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    platform?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    selector?: Prisma.SortOrder;
    extractorCode?: Prisma.SortOrder;
    priority?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    createdById?: Prisma.SortOrder;
    updatedById?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type PlatformSelectorMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    platform?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    selector?: Prisma.SortOrder;
    extractorCode?: Prisma.SortOrder;
    priority?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    createdById?: Prisma.SortOrder;
    updatedById?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type PlatformSelectorSumOrderByAggregateInput = {
    priority?: Prisma.SortOrder;
};
export type PlatformSelectorCreateNestedManyWithoutCreatedByInput = {
    create?: Prisma.XOR<Prisma.PlatformSelectorCreateWithoutCreatedByInput, Prisma.PlatformSelectorUncheckedCreateWithoutCreatedByInput> | Prisma.PlatformSelectorCreateWithoutCreatedByInput[] | Prisma.PlatformSelectorUncheckedCreateWithoutCreatedByInput[];
    connectOrCreate?: Prisma.PlatformSelectorCreateOrConnectWithoutCreatedByInput | Prisma.PlatformSelectorCreateOrConnectWithoutCreatedByInput[];
    createMany?: Prisma.PlatformSelectorCreateManyCreatedByInputEnvelope;
    connect?: Prisma.PlatformSelectorWhereUniqueInput | Prisma.PlatformSelectorWhereUniqueInput[];
};
export type PlatformSelectorCreateNestedManyWithoutUpdatedByInput = {
    create?: Prisma.XOR<Prisma.PlatformSelectorCreateWithoutUpdatedByInput, Prisma.PlatformSelectorUncheckedCreateWithoutUpdatedByInput> | Prisma.PlatformSelectorCreateWithoutUpdatedByInput[] | Prisma.PlatformSelectorUncheckedCreateWithoutUpdatedByInput[];
    connectOrCreate?: Prisma.PlatformSelectorCreateOrConnectWithoutUpdatedByInput | Prisma.PlatformSelectorCreateOrConnectWithoutUpdatedByInput[];
    createMany?: Prisma.PlatformSelectorCreateManyUpdatedByInputEnvelope;
    connect?: Prisma.PlatformSelectorWhereUniqueInput | Prisma.PlatformSelectorWhereUniqueInput[];
};
export type PlatformSelectorUncheckedCreateNestedManyWithoutCreatedByInput = {
    create?: Prisma.XOR<Prisma.PlatformSelectorCreateWithoutCreatedByInput, Prisma.PlatformSelectorUncheckedCreateWithoutCreatedByInput> | Prisma.PlatformSelectorCreateWithoutCreatedByInput[] | Prisma.PlatformSelectorUncheckedCreateWithoutCreatedByInput[];
    connectOrCreate?: Prisma.PlatformSelectorCreateOrConnectWithoutCreatedByInput | Prisma.PlatformSelectorCreateOrConnectWithoutCreatedByInput[];
    createMany?: Prisma.PlatformSelectorCreateManyCreatedByInputEnvelope;
    connect?: Prisma.PlatformSelectorWhereUniqueInput | Prisma.PlatformSelectorWhereUniqueInput[];
};
export type PlatformSelectorUncheckedCreateNestedManyWithoutUpdatedByInput = {
    create?: Prisma.XOR<Prisma.PlatformSelectorCreateWithoutUpdatedByInput, Prisma.PlatformSelectorUncheckedCreateWithoutUpdatedByInput> | Prisma.PlatformSelectorCreateWithoutUpdatedByInput[] | Prisma.PlatformSelectorUncheckedCreateWithoutUpdatedByInput[];
    connectOrCreate?: Prisma.PlatformSelectorCreateOrConnectWithoutUpdatedByInput | Prisma.PlatformSelectorCreateOrConnectWithoutUpdatedByInput[];
    createMany?: Prisma.PlatformSelectorCreateManyUpdatedByInputEnvelope;
    connect?: Prisma.PlatformSelectorWhereUniqueInput | Prisma.PlatformSelectorWhereUniqueInput[];
};
export type PlatformSelectorUpdateManyWithoutCreatedByNestedInput = {
    create?: Prisma.XOR<Prisma.PlatformSelectorCreateWithoutCreatedByInput, Prisma.PlatformSelectorUncheckedCreateWithoutCreatedByInput> | Prisma.PlatformSelectorCreateWithoutCreatedByInput[] | Prisma.PlatformSelectorUncheckedCreateWithoutCreatedByInput[];
    connectOrCreate?: Prisma.PlatformSelectorCreateOrConnectWithoutCreatedByInput | Prisma.PlatformSelectorCreateOrConnectWithoutCreatedByInput[];
    upsert?: Prisma.PlatformSelectorUpsertWithWhereUniqueWithoutCreatedByInput | Prisma.PlatformSelectorUpsertWithWhereUniqueWithoutCreatedByInput[];
    createMany?: Prisma.PlatformSelectorCreateManyCreatedByInputEnvelope;
    set?: Prisma.PlatformSelectorWhereUniqueInput | Prisma.PlatformSelectorWhereUniqueInput[];
    disconnect?: Prisma.PlatformSelectorWhereUniqueInput | Prisma.PlatformSelectorWhereUniqueInput[];
    delete?: Prisma.PlatformSelectorWhereUniqueInput | Prisma.PlatformSelectorWhereUniqueInput[];
    connect?: Prisma.PlatformSelectorWhereUniqueInput | Prisma.PlatformSelectorWhereUniqueInput[];
    update?: Prisma.PlatformSelectorUpdateWithWhereUniqueWithoutCreatedByInput | Prisma.PlatformSelectorUpdateWithWhereUniqueWithoutCreatedByInput[];
    updateMany?: Prisma.PlatformSelectorUpdateManyWithWhereWithoutCreatedByInput | Prisma.PlatformSelectorUpdateManyWithWhereWithoutCreatedByInput[];
    deleteMany?: Prisma.PlatformSelectorScalarWhereInput | Prisma.PlatformSelectorScalarWhereInput[];
};
export type PlatformSelectorUpdateManyWithoutUpdatedByNestedInput = {
    create?: Prisma.XOR<Prisma.PlatformSelectorCreateWithoutUpdatedByInput, Prisma.PlatformSelectorUncheckedCreateWithoutUpdatedByInput> | Prisma.PlatformSelectorCreateWithoutUpdatedByInput[] | Prisma.PlatformSelectorUncheckedCreateWithoutUpdatedByInput[];
    connectOrCreate?: Prisma.PlatformSelectorCreateOrConnectWithoutUpdatedByInput | Prisma.PlatformSelectorCreateOrConnectWithoutUpdatedByInput[];
    upsert?: Prisma.PlatformSelectorUpsertWithWhereUniqueWithoutUpdatedByInput | Prisma.PlatformSelectorUpsertWithWhereUniqueWithoutUpdatedByInput[];
    createMany?: Prisma.PlatformSelectorCreateManyUpdatedByInputEnvelope;
    set?: Prisma.PlatformSelectorWhereUniqueInput | Prisma.PlatformSelectorWhereUniqueInput[];
    disconnect?: Prisma.PlatformSelectorWhereUniqueInput | Prisma.PlatformSelectorWhereUniqueInput[];
    delete?: Prisma.PlatformSelectorWhereUniqueInput | Prisma.PlatformSelectorWhereUniqueInput[];
    connect?: Prisma.PlatformSelectorWhereUniqueInput | Prisma.PlatformSelectorWhereUniqueInput[];
    update?: Prisma.PlatformSelectorUpdateWithWhereUniqueWithoutUpdatedByInput | Prisma.PlatformSelectorUpdateWithWhereUniqueWithoutUpdatedByInput[];
    updateMany?: Prisma.PlatformSelectorUpdateManyWithWhereWithoutUpdatedByInput | Prisma.PlatformSelectorUpdateManyWithWhereWithoutUpdatedByInput[];
    deleteMany?: Prisma.PlatformSelectorScalarWhereInput | Prisma.PlatformSelectorScalarWhereInput[];
};
export type PlatformSelectorUncheckedUpdateManyWithoutCreatedByNestedInput = {
    create?: Prisma.XOR<Prisma.PlatformSelectorCreateWithoutCreatedByInput, Prisma.PlatformSelectorUncheckedCreateWithoutCreatedByInput> | Prisma.PlatformSelectorCreateWithoutCreatedByInput[] | Prisma.PlatformSelectorUncheckedCreateWithoutCreatedByInput[];
    connectOrCreate?: Prisma.PlatformSelectorCreateOrConnectWithoutCreatedByInput | Prisma.PlatformSelectorCreateOrConnectWithoutCreatedByInput[];
    upsert?: Prisma.PlatformSelectorUpsertWithWhereUniqueWithoutCreatedByInput | Prisma.PlatformSelectorUpsertWithWhereUniqueWithoutCreatedByInput[];
    createMany?: Prisma.PlatformSelectorCreateManyCreatedByInputEnvelope;
    set?: Prisma.PlatformSelectorWhereUniqueInput | Prisma.PlatformSelectorWhereUniqueInput[];
    disconnect?: Prisma.PlatformSelectorWhereUniqueInput | Prisma.PlatformSelectorWhereUniqueInput[];
    delete?: Prisma.PlatformSelectorWhereUniqueInput | Prisma.PlatformSelectorWhereUniqueInput[];
    connect?: Prisma.PlatformSelectorWhereUniqueInput | Prisma.PlatformSelectorWhereUniqueInput[];
    update?: Prisma.PlatformSelectorUpdateWithWhereUniqueWithoutCreatedByInput | Prisma.PlatformSelectorUpdateWithWhereUniqueWithoutCreatedByInput[];
    updateMany?: Prisma.PlatformSelectorUpdateManyWithWhereWithoutCreatedByInput | Prisma.PlatformSelectorUpdateManyWithWhereWithoutCreatedByInput[];
    deleteMany?: Prisma.PlatformSelectorScalarWhereInput | Prisma.PlatformSelectorScalarWhereInput[];
};
export type PlatformSelectorUncheckedUpdateManyWithoutUpdatedByNestedInput = {
    create?: Prisma.XOR<Prisma.PlatformSelectorCreateWithoutUpdatedByInput, Prisma.PlatformSelectorUncheckedCreateWithoutUpdatedByInput> | Prisma.PlatformSelectorCreateWithoutUpdatedByInput[] | Prisma.PlatformSelectorUncheckedCreateWithoutUpdatedByInput[];
    connectOrCreate?: Prisma.PlatformSelectorCreateOrConnectWithoutUpdatedByInput | Prisma.PlatformSelectorCreateOrConnectWithoutUpdatedByInput[];
    upsert?: Prisma.PlatformSelectorUpsertWithWhereUniqueWithoutUpdatedByInput | Prisma.PlatformSelectorUpsertWithWhereUniqueWithoutUpdatedByInput[];
    createMany?: Prisma.PlatformSelectorCreateManyUpdatedByInputEnvelope;
    set?: Prisma.PlatformSelectorWhereUniqueInput | Prisma.PlatformSelectorWhereUniqueInput[];
    disconnect?: Prisma.PlatformSelectorWhereUniqueInput | Prisma.PlatformSelectorWhereUniqueInput[];
    delete?: Prisma.PlatformSelectorWhereUniqueInput | Prisma.PlatformSelectorWhereUniqueInput[];
    connect?: Prisma.PlatformSelectorWhereUniqueInput | Prisma.PlatformSelectorWhereUniqueInput[];
    update?: Prisma.PlatformSelectorUpdateWithWhereUniqueWithoutUpdatedByInput | Prisma.PlatformSelectorUpdateWithWhereUniqueWithoutUpdatedByInput[];
    updateMany?: Prisma.PlatformSelectorUpdateManyWithWhereWithoutUpdatedByInput | Prisma.PlatformSelectorUpdateManyWithWhereWithoutUpdatedByInput[];
    deleteMany?: Prisma.PlatformSelectorScalarWhereInput | Prisma.PlatformSelectorScalarWhereInput[];
};
export type EnumSelectorCategoryFieldUpdateOperationsInput = {
    set?: $Enums.SelectorCategory;
};
export type PlatformSelectorCreateWithoutCreatedByInput = {
    id?: string;
    platform: $Enums.Platform;
    category: $Enums.SelectorCategory;
    name: string;
    selector: string;
    extractorCode?: string | null;
    priority?: number;
    isActive?: boolean;
    description?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    updatedBy?: Prisma.UserCreateNestedOneWithoutUpdatedSelectorsInput;
};
export type PlatformSelectorUncheckedCreateWithoutCreatedByInput = {
    id?: string;
    platform: $Enums.Platform;
    category: $Enums.SelectorCategory;
    name: string;
    selector: string;
    extractorCode?: string | null;
    priority?: number;
    isActive?: boolean;
    description?: string | null;
    updatedById?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PlatformSelectorCreateOrConnectWithoutCreatedByInput = {
    where: Prisma.PlatformSelectorWhereUniqueInput;
    create: Prisma.XOR<Prisma.PlatformSelectorCreateWithoutCreatedByInput, Prisma.PlatformSelectorUncheckedCreateWithoutCreatedByInput>;
};
export type PlatformSelectorCreateManyCreatedByInputEnvelope = {
    data: Prisma.PlatformSelectorCreateManyCreatedByInput | Prisma.PlatformSelectorCreateManyCreatedByInput[];
    skipDuplicates?: boolean;
};
export type PlatformSelectorCreateWithoutUpdatedByInput = {
    id?: string;
    platform: $Enums.Platform;
    category: $Enums.SelectorCategory;
    name: string;
    selector: string;
    extractorCode?: string | null;
    priority?: number;
    isActive?: boolean;
    description?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    createdBy?: Prisma.UserCreateNestedOneWithoutCreatedSelectorsInput;
};
export type PlatformSelectorUncheckedCreateWithoutUpdatedByInput = {
    id?: string;
    platform: $Enums.Platform;
    category: $Enums.SelectorCategory;
    name: string;
    selector: string;
    extractorCode?: string | null;
    priority?: number;
    isActive?: boolean;
    description?: string | null;
    createdById?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PlatformSelectorCreateOrConnectWithoutUpdatedByInput = {
    where: Prisma.PlatformSelectorWhereUniqueInput;
    create: Prisma.XOR<Prisma.PlatformSelectorCreateWithoutUpdatedByInput, Prisma.PlatformSelectorUncheckedCreateWithoutUpdatedByInput>;
};
export type PlatformSelectorCreateManyUpdatedByInputEnvelope = {
    data: Prisma.PlatformSelectorCreateManyUpdatedByInput | Prisma.PlatformSelectorCreateManyUpdatedByInput[];
    skipDuplicates?: boolean;
};
export type PlatformSelectorUpsertWithWhereUniqueWithoutCreatedByInput = {
    where: Prisma.PlatformSelectorWhereUniqueInput;
    update: Prisma.XOR<Prisma.PlatformSelectorUpdateWithoutCreatedByInput, Prisma.PlatformSelectorUncheckedUpdateWithoutCreatedByInput>;
    create: Prisma.XOR<Prisma.PlatformSelectorCreateWithoutCreatedByInput, Prisma.PlatformSelectorUncheckedCreateWithoutCreatedByInput>;
};
export type PlatformSelectorUpdateWithWhereUniqueWithoutCreatedByInput = {
    where: Prisma.PlatformSelectorWhereUniqueInput;
    data: Prisma.XOR<Prisma.PlatformSelectorUpdateWithoutCreatedByInput, Prisma.PlatformSelectorUncheckedUpdateWithoutCreatedByInput>;
};
export type PlatformSelectorUpdateManyWithWhereWithoutCreatedByInput = {
    where: Prisma.PlatformSelectorScalarWhereInput;
    data: Prisma.XOR<Prisma.PlatformSelectorUpdateManyMutationInput, Prisma.PlatformSelectorUncheckedUpdateManyWithoutCreatedByInput>;
};
export type PlatformSelectorScalarWhereInput = {
    AND?: Prisma.PlatformSelectorScalarWhereInput | Prisma.PlatformSelectorScalarWhereInput[];
    OR?: Prisma.PlatformSelectorScalarWhereInput[];
    NOT?: Prisma.PlatformSelectorScalarWhereInput | Prisma.PlatformSelectorScalarWhereInput[];
    id?: Prisma.StringFilter<"PlatformSelector"> | string;
    platform?: Prisma.EnumPlatformFilter<"PlatformSelector"> | $Enums.Platform;
    category?: Prisma.EnumSelectorCategoryFilter<"PlatformSelector"> | $Enums.SelectorCategory;
    name?: Prisma.StringFilter<"PlatformSelector"> | string;
    selector?: Prisma.StringFilter<"PlatformSelector"> | string;
    extractorCode?: Prisma.StringNullableFilter<"PlatformSelector"> | string | null;
    priority?: Prisma.IntFilter<"PlatformSelector"> | number;
    isActive?: Prisma.BoolFilter<"PlatformSelector"> | boolean;
    description?: Prisma.StringNullableFilter<"PlatformSelector"> | string | null;
    createdById?: Prisma.StringNullableFilter<"PlatformSelector"> | string | null;
    updatedById?: Prisma.StringNullableFilter<"PlatformSelector"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"PlatformSelector"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"PlatformSelector"> | Date | string;
};
export type PlatformSelectorUpsertWithWhereUniqueWithoutUpdatedByInput = {
    where: Prisma.PlatformSelectorWhereUniqueInput;
    update: Prisma.XOR<Prisma.PlatformSelectorUpdateWithoutUpdatedByInput, Prisma.PlatformSelectorUncheckedUpdateWithoutUpdatedByInput>;
    create: Prisma.XOR<Prisma.PlatformSelectorCreateWithoutUpdatedByInput, Prisma.PlatformSelectorUncheckedCreateWithoutUpdatedByInput>;
};
export type PlatformSelectorUpdateWithWhereUniqueWithoutUpdatedByInput = {
    where: Prisma.PlatformSelectorWhereUniqueInput;
    data: Prisma.XOR<Prisma.PlatformSelectorUpdateWithoutUpdatedByInput, Prisma.PlatformSelectorUncheckedUpdateWithoutUpdatedByInput>;
};
export type PlatformSelectorUpdateManyWithWhereWithoutUpdatedByInput = {
    where: Prisma.PlatformSelectorScalarWhereInput;
    data: Prisma.XOR<Prisma.PlatformSelectorUpdateManyMutationInput, Prisma.PlatformSelectorUncheckedUpdateManyWithoutUpdatedByInput>;
};
export type PlatformSelectorCreateManyCreatedByInput = {
    id?: string;
    platform: $Enums.Platform;
    category: $Enums.SelectorCategory;
    name: string;
    selector: string;
    extractorCode?: string | null;
    priority?: number;
    isActive?: boolean;
    description?: string | null;
    updatedById?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PlatformSelectorCreateManyUpdatedByInput = {
    id?: string;
    platform: $Enums.Platform;
    category: $Enums.SelectorCategory;
    name: string;
    selector: string;
    extractorCode?: string | null;
    priority?: number;
    isActive?: boolean;
    description?: string | null;
    createdById?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PlatformSelectorUpdateWithoutCreatedByInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    platform?: Prisma.EnumPlatformFieldUpdateOperationsInput | $Enums.Platform;
    category?: Prisma.EnumSelectorCategoryFieldUpdateOperationsInput | $Enums.SelectorCategory;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    selector?: Prisma.StringFieldUpdateOperationsInput | string;
    extractorCode?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    priority?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedBy?: Prisma.UserUpdateOneWithoutUpdatedSelectorsNestedInput;
};
export type PlatformSelectorUncheckedUpdateWithoutCreatedByInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    platform?: Prisma.EnumPlatformFieldUpdateOperationsInput | $Enums.Platform;
    category?: Prisma.EnumSelectorCategoryFieldUpdateOperationsInput | $Enums.SelectorCategory;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    selector?: Prisma.StringFieldUpdateOperationsInput | string;
    extractorCode?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    priority?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    updatedById?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PlatformSelectorUncheckedUpdateManyWithoutCreatedByInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    platform?: Prisma.EnumPlatformFieldUpdateOperationsInput | $Enums.Platform;
    category?: Prisma.EnumSelectorCategoryFieldUpdateOperationsInput | $Enums.SelectorCategory;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    selector?: Prisma.StringFieldUpdateOperationsInput | string;
    extractorCode?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    priority?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    updatedById?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PlatformSelectorUpdateWithoutUpdatedByInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    platform?: Prisma.EnumPlatformFieldUpdateOperationsInput | $Enums.Platform;
    category?: Prisma.EnumSelectorCategoryFieldUpdateOperationsInput | $Enums.SelectorCategory;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    selector?: Prisma.StringFieldUpdateOperationsInput | string;
    extractorCode?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    priority?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdBy?: Prisma.UserUpdateOneWithoutCreatedSelectorsNestedInput;
};
export type PlatformSelectorUncheckedUpdateWithoutUpdatedByInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    platform?: Prisma.EnumPlatformFieldUpdateOperationsInput | $Enums.Platform;
    category?: Prisma.EnumSelectorCategoryFieldUpdateOperationsInput | $Enums.SelectorCategory;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    selector?: Prisma.StringFieldUpdateOperationsInput | string;
    extractorCode?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    priority?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdById?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PlatformSelectorUncheckedUpdateManyWithoutUpdatedByInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    platform?: Prisma.EnumPlatformFieldUpdateOperationsInput | $Enums.Platform;
    category?: Prisma.EnumSelectorCategoryFieldUpdateOperationsInput | $Enums.SelectorCategory;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    selector?: Prisma.StringFieldUpdateOperationsInput | string;
    extractorCode?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    priority?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdById?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PlatformSelectorSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    platform?: boolean;
    category?: boolean;
    name?: boolean;
    selector?: boolean;
    extractorCode?: boolean;
    priority?: boolean;
    isActive?: boolean;
    description?: boolean;
    createdById?: boolean;
    updatedById?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    createdBy?: boolean | Prisma.PlatformSelector$createdByArgs<ExtArgs>;
    updatedBy?: boolean | Prisma.PlatformSelector$updatedByArgs<ExtArgs>;
}, ExtArgs["result"]["platformSelector"]>;
export type PlatformSelectorSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    platform?: boolean;
    category?: boolean;
    name?: boolean;
    selector?: boolean;
    extractorCode?: boolean;
    priority?: boolean;
    isActive?: boolean;
    description?: boolean;
    createdById?: boolean;
    updatedById?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    createdBy?: boolean | Prisma.PlatformSelector$createdByArgs<ExtArgs>;
    updatedBy?: boolean | Prisma.PlatformSelector$updatedByArgs<ExtArgs>;
}, ExtArgs["result"]["platformSelector"]>;
export type PlatformSelectorSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    platform?: boolean;
    category?: boolean;
    name?: boolean;
    selector?: boolean;
    extractorCode?: boolean;
    priority?: boolean;
    isActive?: boolean;
    description?: boolean;
    createdById?: boolean;
    updatedById?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    createdBy?: boolean | Prisma.PlatformSelector$createdByArgs<ExtArgs>;
    updatedBy?: boolean | Prisma.PlatformSelector$updatedByArgs<ExtArgs>;
}, ExtArgs["result"]["platformSelector"]>;
export type PlatformSelectorSelectScalar = {
    id?: boolean;
    platform?: boolean;
    category?: boolean;
    name?: boolean;
    selector?: boolean;
    extractorCode?: boolean;
    priority?: boolean;
    isActive?: boolean;
    description?: boolean;
    createdById?: boolean;
    updatedById?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type PlatformSelectorOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "platform" | "category" | "name" | "selector" | "extractorCode" | "priority" | "isActive" | "description" | "createdById" | "updatedById" | "createdAt" | "updatedAt", ExtArgs["result"]["platformSelector"]>;
export type PlatformSelectorInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    createdBy?: boolean | Prisma.PlatformSelector$createdByArgs<ExtArgs>;
    updatedBy?: boolean | Prisma.PlatformSelector$updatedByArgs<ExtArgs>;
};
export type PlatformSelectorIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    createdBy?: boolean | Prisma.PlatformSelector$createdByArgs<ExtArgs>;
    updatedBy?: boolean | Prisma.PlatformSelector$updatedByArgs<ExtArgs>;
};
export type PlatformSelectorIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    createdBy?: boolean | Prisma.PlatformSelector$createdByArgs<ExtArgs>;
    updatedBy?: boolean | Prisma.PlatformSelector$updatedByArgs<ExtArgs>;
};
export type $PlatformSelectorPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "PlatformSelector";
    objects: {
        createdBy: Prisma.$UserPayload<ExtArgs> | null;
        updatedBy: Prisma.$UserPayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        platform: $Enums.Platform;
        category: $Enums.SelectorCategory;
        name: string;
        selector: string;
        extractorCode: string | null;
        priority: number;
        isActive: boolean;
        description: string | null;
        createdById: string | null;
        updatedById: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["platformSelector"]>;
    composites: {};
};
export type PlatformSelectorGetPayload<S extends boolean | null | undefined | PlatformSelectorDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$PlatformSelectorPayload, S>;
export type PlatformSelectorCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<PlatformSelectorFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: PlatformSelectorCountAggregateInputType | true;
};
export interface PlatformSelectorDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['PlatformSelector'];
        meta: {
            name: 'PlatformSelector';
        };
    };
    /**
     * Find zero or one PlatformSelector that matches the filter.
     * @param {PlatformSelectorFindUniqueArgs} args - Arguments to find a PlatformSelector
     * @example
     * // Get one PlatformSelector
     * const platformSelector = await prisma.platformSelector.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PlatformSelectorFindUniqueArgs>(args: Prisma.SelectSubset<T, PlatformSelectorFindUniqueArgs<ExtArgs>>): Prisma.Prisma__PlatformSelectorClient<runtime.Types.Result.GetResult<Prisma.$PlatformSelectorPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one PlatformSelector that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PlatformSelectorFindUniqueOrThrowArgs} args - Arguments to find a PlatformSelector
     * @example
     * // Get one PlatformSelector
     * const platformSelector = await prisma.platformSelector.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PlatformSelectorFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, PlatformSelectorFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__PlatformSelectorClient<runtime.Types.Result.GetResult<Prisma.$PlatformSelectorPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first PlatformSelector that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlatformSelectorFindFirstArgs} args - Arguments to find a PlatformSelector
     * @example
     * // Get one PlatformSelector
     * const platformSelector = await prisma.platformSelector.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PlatformSelectorFindFirstArgs>(args?: Prisma.SelectSubset<T, PlatformSelectorFindFirstArgs<ExtArgs>>): Prisma.Prisma__PlatformSelectorClient<runtime.Types.Result.GetResult<Prisma.$PlatformSelectorPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first PlatformSelector that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlatformSelectorFindFirstOrThrowArgs} args - Arguments to find a PlatformSelector
     * @example
     * // Get one PlatformSelector
     * const platformSelector = await prisma.platformSelector.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PlatformSelectorFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, PlatformSelectorFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__PlatformSelectorClient<runtime.Types.Result.GetResult<Prisma.$PlatformSelectorPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more PlatformSelectors that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlatformSelectorFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PlatformSelectors
     * const platformSelectors = await prisma.platformSelector.findMany()
     *
     * // Get first 10 PlatformSelectors
     * const platformSelectors = await prisma.platformSelector.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const platformSelectorWithIdOnly = await prisma.platformSelector.findMany({ select: { id: true } })
     *
     */
    findMany<T extends PlatformSelectorFindManyArgs>(args?: Prisma.SelectSubset<T, PlatformSelectorFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PlatformSelectorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a PlatformSelector.
     * @param {PlatformSelectorCreateArgs} args - Arguments to create a PlatformSelector.
     * @example
     * // Create one PlatformSelector
     * const PlatformSelector = await prisma.platformSelector.create({
     *   data: {
     *     // ... data to create a PlatformSelector
     *   }
     * })
     *
     */
    create<T extends PlatformSelectorCreateArgs>(args: Prisma.SelectSubset<T, PlatformSelectorCreateArgs<ExtArgs>>): Prisma.Prisma__PlatformSelectorClient<runtime.Types.Result.GetResult<Prisma.$PlatformSelectorPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many PlatformSelectors.
     * @param {PlatformSelectorCreateManyArgs} args - Arguments to create many PlatformSelectors.
     * @example
     * // Create many PlatformSelectors
     * const platformSelector = await prisma.platformSelector.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends PlatformSelectorCreateManyArgs>(args?: Prisma.SelectSubset<T, PlatformSelectorCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many PlatformSelectors and returns the data saved in the database.
     * @param {PlatformSelectorCreateManyAndReturnArgs} args - Arguments to create many PlatformSelectors.
     * @example
     * // Create many PlatformSelectors
     * const platformSelector = await prisma.platformSelector.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many PlatformSelectors and only return the `id`
     * const platformSelectorWithIdOnly = await prisma.platformSelector.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends PlatformSelectorCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, PlatformSelectorCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PlatformSelectorPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a PlatformSelector.
     * @param {PlatformSelectorDeleteArgs} args - Arguments to delete one PlatformSelector.
     * @example
     * // Delete one PlatformSelector
     * const PlatformSelector = await prisma.platformSelector.delete({
     *   where: {
     *     // ... filter to delete one PlatformSelector
     *   }
     * })
     *
     */
    delete<T extends PlatformSelectorDeleteArgs>(args: Prisma.SelectSubset<T, PlatformSelectorDeleteArgs<ExtArgs>>): Prisma.Prisma__PlatformSelectorClient<runtime.Types.Result.GetResult<Prisma.$PlatformSelectorPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one PlatformSelector.
     * @param {PlatformSelectorUpdateArgs} args - Arguments to update one PlatformSelector.
     * @example
     * // Update one PlatformSelector
     * const platformSelector = await prisma.platformSelector.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends PlatformSelectorUpdateArgs>(args: Prisma.SelectSubset<T, PlatformSelectorUpdateArgs<ExtArgs>>): Prisma.Prisma__PlatformSelectorClient<runtime.Types.Result.GetResult<Prisma.$PlatformSelectorPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more PlatformSelectors.
     * @param {PlatformSelectorDeleteManyArgs} args - Arguments to filter PlatformSelectors to delete.
     * @example
     * // Delete a few PlatformSelectors
     * const { count } = await prisma.platformSelector.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends PlatformSelectorDeleteManyArgs>(args?: Prisma.SelectSubset<T, PlatformSelectorDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more PlatformSelectors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlatformSelectorUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PlatformSelectors
     * const platformSelector = await prisma.platformSelector.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends PlatformSelectorUpdateManyArgs>(args: Prisma.SelectSubset<T, PlatformSelectorUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more PlatformSelectors and returns the data updated in the database.
     * @param {PlatformSelectorUpdateManyAndReturnArgs} args - Arguments to update many PlatformSelectors.
     * @example
     * // Update many PlatformSelectors
     * const platformSelector = await prisma.platformSelector.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more PlatformSelectors and only return the `id`
     * const platformSelectorWithIdOnly = await prisma.platformSelector.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends PlatformSelectorUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, PlatformSelectorUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PlatformSelectorPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one PlatformSelector.
     * @param {PlatformSelectorUpsertArgs} args - Arguments to update or create a PlatformSelector.
     * @example
     * // Update or create a PlatformSelector
     * const platformSelector = await prisma.platformSelector.upsert({
     *   create: {
     *     // ... data to create a PlatformSelector
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PlatformSelector we want to update
     *   }
     * })
     */
    upsert<T extends PlatformSelectorUpsertArgs>(args: Prisma.SelectSubset<T, PlatformSelectorUpsertArgs<ExtArgs>>): Prisma.Prisma__PlatformSelectorClient<runtime.Types.Result.GetResult<Prisma.$PlatformSelectorPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of PlatformSelectors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlatformSelectorCountArgs} args - Arguments to filter PlatformSelectors to count.
     * @example
     * // Count the number of PlatformSelectors
     * const count = await prisma.platformSelector.count({
     *   where: {
     *     // ... the filter for the PlatformSelectors we want to count
     *   }
     * })
    **/
    count<T extends PlatformSelectorCountArgs>(args?: Prisma.Subset<T, PlatformSelectorCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], PlatformSelectorCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a PlatformSelector.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlatformSelectorAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PlatformSelectorAggregateArgs>(args: Prisma.Subset<T, PlatformSelectorAggregateArgs>): Prisma.PrismaPromise<GetPlatformSelectorAggregateType<T>>;
    /**
     * Group by PlatformSelector.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlatformSelectorGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<T extends PlatformSelectorGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: PlatformSelectorGroupByArgs['orderBy'];
    } : {
        orderBy?: PlatformSelectorGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, PlatformSelectorGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPlatformSelectorGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the PlatformSelector model
     */
    readonly fields: PlatformSelectorFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for PlatformSelector.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__PlatformSelectorClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    createdBy<T extends Prisma.PlatformSelector$createdByArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.PlatformSelector$createdByArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    updatedBy<T extends Prisma.PlatformSelector$updatedByArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.PlatformSelector$updatedByArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
/**
 * Fields of the PlatformSelector model
 */
export interface PlatformSelectorFieldRefs {
    readonly id: Prisma.FieldRef<"PlatformSelector", 'String'>;
    readonly platform: Prisma.FieldRef<"PlatformSelector", 'Platform'>;
    readonly category: Prisma.FieldRef<"PlatformSelector", 'SelectorCategory'>;
    readonly name: Prisma.FieldRef<"PlatformSelector", 'String'>;
    readonly selector: Prisma.FieldRef<"PlatformSelector", 'String'>;
    readonly extractorCode: Prisma.FieldRef<"PlatformSelector", 'String'>;
    readonly priority: Prisma.FieldRef<"PlatformSelector", 'Int'>;
    readonly isActive: Prisma.FieldRef<"PlatformSelector", 'Boolean'>;
    readonly description: Prisma.FieldRef<"PlatformSelector", 'String'>;
    readonly createdById: Prisma.FieldRef<"PlatformSelector", 'String'>;
    readonly updatedById: Prisma.FieldRef<"PlatformSelector", 'String'>;
    readonly createdAt: Prisma.FieldRef<"PlatformSelector", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"PlatformSelector", 'DateTime'>;
}
/**
 * PlatformSelector findUnique
 */
export type PlatformSelectorFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlatformSelector
     */
    select?: Prisma.PlatformSelectorSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlatformSelector
     */
    omit?: Prisma.PlatformSelectorOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PlatformSelectorInclude<ExtArgs> | null;
    /**
     * Filter, which PlatformSelector to fetch.
     */
    where: Prisma.PlatformSelectorWhereUniqueInput;
};
/**
 * PlatformSelector findUniqueOrThrow
 */
export type PlatformSelectorFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlatformSelector
     */
    select?: Prisma.PlatformSelectorSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlatformSelector
     */
    omit?: Prisma.PlatformSelectorOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PlatformSelectorInclude<ExtArgs> | null;
    /**
     * Filter, which PlatformSelector to fetch.
     */
    where: Prisma.PlatformSelectorWhereUniqueInput;
};
/**
 * PlatformSelector findFirst
 */
export type PlatformSelectorFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlatformSelector
     */
    select?: Prisma.PlatformSelectorSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlatformSelector
     */
    omit?: Prisma.PlatformSelectorOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PlatformSelectorInclude<ExtArgs> | null;
    /**
     * Filter, which PlatformSelector to fetch.
     */
    where?: Prisma.PlatformSelectorWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PlatformSelectors to fetch.
     */
    orderBy?: Prisma.PlatformSelectorOrderByWithRelationInput | Prisma.PlatformSelectorOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for PlatformSelectors.
     */
    cursor?: Prisma.PlatformSelectorWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PlatformSelectors from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PlatformSelectors.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of PlatformSelectors.
     */
    distinct?: Prisma.PlatformSelectorScalarFieldEnum | Prisma.PlatformSelectorScalarFieldEnum[];
};
/**
 * PlatformSelector findFirstOrThrow
 */
export type PlatformSelectorFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlatformSelector
     */
    select?: Prisma.PlatformSelectorSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlatformSelector
     */
    omit?: Prisma.PlatformSelectorOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PlatformSelectorInclude<ExtArgs> | null;
    /**
     * Filter, which PlatformSelector to fetch.
     */
    where?: Prisma.PlatformSelectorWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PlatformSelectors to fetch.
     */
    orderBy?: Prisma.PlatformSelectorOrderByWithRelationInput | Prisma.PlatformSelectorOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for PlatformSelectors.
     */
    cursor?: Prisma.PlatformSelectorWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PlatformSelectors from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PlatformSelectors.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of PlatformSelectors.
     */
    distinct?: Prisma.PlatformSelectorScalarFieldEnum | Prisma.PlatformSelectorScalarFieldEnum[];
};
/**
 * PlatformSelector findMany
 */
export type PlatformSelectorFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlatformSelector
     */
    select?: Prisma.PlatformSelectorSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlatformSelector
     */
    omit?: Prisma.PlatformSelectorOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PlatformSelectorInclude<ExtArgs> | null;
    /**
     * Filter, which PlatformSelectors to fetch.
     */
    where?: Prisma.PlatformSelectorWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PlatformSelectors to fetch.
     */
    orderBy?: Prisma.PlatformSelectorOrderByWithRelationInput | Prisma.PlatformSelectorOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing PlatformSelectors.
     */
    cursor?: Prisma.PlatformSelectorWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PlatformSelectors from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PlatformSelectors.
     */
    skip?: number;
    distinct?: Prisma.PlatformSelectorScalarFieldEnum | Prisma.PlatformSelectorScalarFieldEnum[];
};
/**
 * PlatformSelector create
 */
export type PlatformSelectorCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlatformSelector
     */
    select?: Prisma.PlatformSelectorSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlatformSelector
     */
    omit?: Prisma.PlatformSelectorOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PlatformSelectorInclude<ExtArgs> | null;
    /**
     * The data needed to create a PlatformSelector.
     */
    data: Prisma.XOR<Prisma.PlatformSelectorCreateInput, Prisma.PlatformSelectorUncheckedCreateInput>;
};
/**
 * PlatformSelector createMany
 */
export type PlatformSelectorCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many PlatformSelectors.
     */
    data: Prisma.PlatformSelectorCreateManyInput | Prisma.PlatformSelectorCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * PlatformSelector createManyAndReturn
 */
export type PlatformSelectorCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlatformSelector
     */
    select?: Prisma.PlatformSelectorSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the PlatformSelector
     */
    omit?: Prisma.PlatformSelectorOmit<ExtArgs> | null;
    /**
     * The data used to create many PlatformSelectors.
     */
    data: Prisma.PlatformSelectorCreateManyInput | Prisma.PlatformSelectorCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PlatformSelectorIncludeCreateManyAndReturn<ExtArgs> | null;
};
/**
 * PlatformSelector update
 */
export type PlatformSelectorUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlatformSelector
     */
    select?: Prisma.PlatformSelectorSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlatformSelector
     */
    omit?: Prisma.PlatformSelectorOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PlatformSelectorInclude<ExtArgs> | null;
    /**
     * The data needed to update a PlatformSelector.
     */
    data: Prisma.XOR<Prisma.PlatformSelectorUpdateInput, Prisma.PlatformSelectorUncheckedUpdateInput>;
    /**
     * Choose, which PlatformSelector to update.
     */
    where: Prisma.PlatformSelectorWhereUniqueInput;
};
/**
 * PlatformSelector updateMany
 */
export type PlatformSelectorUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update PlatformSelectors.
     */
    data: Prisma.XOR<Prisma.PlatformSelectorUpdateManyMutationInput, Prisma.PlatformSelectorUncheckedUpdateManyInput>;
    /**
     * Filter which PlatformSelectors to update
     */
    where?: Prisma.PlatformSelectorWhereInput;
    /**
     * Limit how many PlatformSelectors to update.
     */
    limit?: number;
};
/**
 * PlatformSelector updateManyAndReturn
 */
export type PlatformSelectorUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlatformSelector
     */
    select?: Prisma.PlatformSelectorSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the PlatformSelector
     */
    omit?: Prisma.PlatformSelectorOmit<ExtArgs> | null;
    /**
     * The data used to update PlatformSelectors.
     */
    data: Prisma.XOR<Prisma.PlatformSelectorUpdateManyMutationInput, Prisma.PlatformSelectorUncheckedUpdateManyInput>;
    /**
     * Filter which PlatformSelectors to update
     */
    where?: Prisma.PlatformSelectorWhereInput;
    /**
     * Limit how many PlatformSelectors to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PlatformSelectorIncludeUpdateManyAndReturn<ExtArgs> | null;
};
/**
 * PlatformSelector upsert
 */
export type PlatformSelectorUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlatformSelector
     */
    select?: Prisma.PlatformSelectorSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlatformSelector
     */
    omit?: Prisma.PlatformSelectorOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PlatformSelectorInclude<ExtArgs> | null;
    /**
     * The filter to search for the PlatformSelector to update in case it exists.
     */
    where: Prisma.PlatformSelectorWhereUniqueInput;
    /**
     * In case the PlatformSelector found by the `where` argument doesn't exist, create a new PlatformSelector with this data.
     */
    create: Prisma.XOR<Prisma.PlatformSelectorCreateInput, Prisma.PlatformSelectorUncheckedCreateInput>;
    /**
     * In case the PlatformSelector was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.PlatformSelectorUpdateInput, Prisma.PlatformSelectorUncheckedUpdateInput>;
};
/**
 * PlatformSelector delete
 */
export type PlatformSelectorDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlatformSelector
     */
    select?: Prisma.PlatformSelectorSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlatformSelector
     */
    omit?: Prisma.PlatformSelectorOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PlatformSelectorInclude<ExtArgs> | null;
    /**
     * Filter which PlatformSelector to delete.
     */
    where: Prisma.PlatformSelectorWhereUniqueInput;
};
/**
 * PlatformSelector deleteMany
 */
export type PlatformSelectorDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which PlatformSelectors to delete
     */
    where?: Prisma.PlatformSelectorWhereInput;
    /**
     * Limit how many PlatformSelectors to delete.
     */
    limit?: number;
};
/**
 * PlatformSelector.createdBy
 */
export type PlatformSelector$createdByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: Prisma.UserSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the User
     */
    omit?: Prisma.UserOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.UserInclude<ExtArgs> | null;
    where?: Prisma.UserWhereInput;
};
/**
 * PlatformSelector.updatedBy
 */
export type PlatformSelector$updatedByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: Prisma.UserSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the User
     */
    omit?: Prisma.UserOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.UserInclude<ExtArgs> | null;
    where?: Prisma.UserWhereInput;
};
/**
 * PlatformSelector without action
 */
export type PlatformSelectorDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlatformSelector
     */
    select?: Prisma.PlatformSelectorSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlatformSelector
     */
    omit?: Prisma.PlatformSelectorOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PlatformSelectorInclude<ExtArgs> | null;
};
export {};
//# sourceMappingURL=PlatformSelector.d.ts.map