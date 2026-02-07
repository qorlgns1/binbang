import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
/**
 * Model User
 *
 */
export type UserModel = runtime.Types.Result.DefaultSelection<Prisma.$UserPayload>;
export type AggregateUser = {
    _count: UserCountAggregateOutputType | null;
    _min: UserMinAggregateOutputType | null;
    _max: UserMaxAggregateOutputType | null;
};
export type UserMinAggregateOutputType = {
    id: string | null;
    name: string | null;
    email: string | null;
    emailVerified: Date | null;
    image: string | null;
    password: string | null;
    kakaoAccessToken: string | null;
    kakaoRefreshToken: string | null;
    kakaoTokenExpiry: Date | null;
    planId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type UserMaxAggregateOutputType = {
    id: string | null;
    name: string | null;
    email: string | null;
    emailVerified: Date | null;
    image: string | null;
    password: string | null;
    kakaoAccessToken: string | null;
    kakaoRefreshToken: string | null;
    kakaoTokenExpiry: Date | null;
    planId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type UserCountAggregateOutputType = {
    id: number;
    name: number;
    email: number;
    emailVerified: number;
    image: number;
    password: number;
    kakaoAccessToken: number;
    kakaoRefreshToken: number;
    kakaoTokenExpiry: number;
    planId: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type UserMinAggregateInputType = {
    id?: true;
    name?: true;
    email?: true;
    emailVerified?: true;
    image?: true;
    password?: true;
    kakaoAccessToken?: true;
    kakaoRefreshToken?: true;
    kakaoTokenExpiry?: true;
    planId?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type UserMaxAggregateInputType = {
    id?: true;
    name?: true;
    email?: true;
    emailVerified?: true;
    image?: true;
    password?: true;
    kakaoAccessToken?: true;
    kakaoRefreshToken?: true;
    kakaoTokenExpiry?: true;
    planId?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type UserCountAggregateInputType = {
    id?: true;
    name?: true;
    email?: true;
    emailVerified?: true;
    image?: true;
    password?: true;
    kakaoAccessToken?: true;
    kakaoRefreshToken?: true;
    kakaoTokenExpiry?: true;
    planId?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type UserAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: Prisma.UserWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.UserWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType;
};
export type GetUserAggregateType<T extends UserAggregateArgs> = {
    [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateUser[P]> : Prisma.GetScalarType<T[P], AggregateUser[P]>;
};
export type UserGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithAggregationInput | Prisma.UserOrderByWithAggregationInput[];
    by: Prisma.UserScalarFieldEnum[] | Prisma.UserScalarFieldEnum;
    having?: Prisma.UserScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: UserCountAggregateInputType | true;
    _min?: UserMinAggregateInputType;
    _max?: UserMaxAggregateInputType;
};
export type UserGroupByOutputType = {
    id: string;
    name: string | null;
    email: string | null;
    emailVerified: Date | null;
    image: string | null;
    password: string | null;
    kakaoAccessToken: string | null;
    kakaoRefreshToken: string | null;
    kakaoTokenExpiry: Date | null;
    planId: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: UserCountAggregateOutputType | null;
    _min: UserMinAggregateOutputType | null;
    _max: UserMaxAggregateOutputType | null;
};
type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<UserGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], UserGroupByOutputType[P]> : Prisma.GetScalarType<T[P], UserGroupByOutputType[P]>;
}>>;
export type UserWhereInput = {
    AND?: Prisma.UserWhereInput | Prisma.UserWhereInput[];
    OR?: Prisma.UserWhereInput[];
    NOT?: Prisma.UserWhereInput | Prisma.UserWhereInput[];
    id?: Prisma.StringFilter<"User"> | string;
    name?: Prisma.StringNullableFilter<"User"> | string | null;
    email?: Prisma.StringNullableFilter<"User"> | string | null;
    emailVerified?: Prisma.DateTimeNullableFilter<"User"> | Date | string | null;
    image?: Prisma.StringNullableFilter<"User"> | string | null;
    password?: Prisma.StringNullableFilter<"User"> | string | null;
    kakaoAccessToken?: Prisma.StringNullableFilter<"User"> | string | null;
    kakaoRefreshToken?: Prisma.StringNullableFilter<"User"> | string | null;
    kakaoTokenExpiry?: Prisma.DateTimeNullableFilter<"User"> | Date | string | null;
    planId?: Prisma.StringNullableFilter<"User"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"User"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"User"> | Date | string;
    plan?: Prisma.XOR<Prisma.PlanNullableScalarRelationFilter, Prisma.PlanWhereInput> | null;
    roles?: Prisma.RoleListRelationFilter;
    accounts?: Prisma.AccountListRelationFilter;
    sessions?: Prisma.SessionListRelationFilter;
    accommodations?: Prisma.AccommodationListRelationFilter;
    checkLogs?: Prisma.CheckLogListRelationFilter;
    settingsChangeLogs?: Prisma.SettingsChangeLogListRelationFilter;
    auditLogs?: Prisma.AuditLogListRelationFilter;
    auditLogsAsTarget?: Prisma.AuditLogListRelationFilter;
    subscriptions?: Prisma.SubscriptionListRelationFilter;
    createdSelectors?: Prisma.PlatformSelectorListRelationFilter;
    updatedSelectors?: Prisma.PlatformSelectorListRelationFilter;
    createdPatterns?: Prisma.PlatformPatternListRelationFilter;
    selectorChangeLogs?: Prisma.SelectorChangeLogListRelationFilter;
};
export type UserOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrderInput | Prisma.SortOrder;
    email?: Prisma.SortOrderInput | Prisma.SortOrder;
    emailVerified?: Prisma.SortOrderInput | Prisma.SortOrder;
    image?: Prisma.SortOrderInput | Prisma.SortOrder;
    password?: Prisma.SortOrderInput | Prisma.SortOrder;
    kakaoAccessToken?: Prisma.SortOrderInput | Prisma.SortOrder;
    kakaoRefreshToken?: Prisma.SortOrderInput | Prisma.SortOrder;
    kakaoTokenExpiry?: Prisma.SortOrderInput | Prisma.SortOrder;
    planId?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    plan?: Prisma.PlanOrderByWithRelationInput;
    roles?: Prisma.RoleOrderByRelationAggregateInput;
    accounts?: Prisma.AccountOrderByRelationAggregateInput;
    sessions?: Prisma.SessionOrderByRelationAggregateInput;
    accommodations?: Prisma.AccommodationOrderByRelationAggregateInput;
    checkLogs?: Prisma.CheckLogOrderByRelationAggregateInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogOrderByRelationAggregateInput;
    auditLogs?: Prisma.AuditLogOrderByRelationAggregateInput;
    auditLogsAsTarget?: Prisma.AuditLogOrderByRelationAggregateInput;
    subscriptions?: Prisma.SubscriptionOrderByRelationAggregateInput;
    createdSelectors?: Prisma.PlatformSelectorOrderByRelationAggregateInput;
    updatedSelectors?: Prisma.PlatformSelectorOrderByRelationAggregateInput;
    createdPatterns?: Prisma.PlatformPatternOrderByRelationAggregateInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogOrderByRelationAggregateInput;
};
export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    email?: string;
    AND?: Prisma.UserWhereInput | Prisma.UserWhereInput[];
    OR?: Prisma.UserWhereInput[];
    NOT?: Prisma.UserWhereInput | Prisma.UserWhereInput[];
    name?: Prisma.StringNullableFilter<"User"> | string | null;
    emailVerified?: Prisma.DateTimeNullableFilter<"User"> | Date | string | null;
    image?: Prisma.StringNullableFilter<"User"> | string | null;
    password?: Prisma.StringNullableFilter<"User"> | string | null;
    kakaoAccessToken?: Prisma.StringNullableFilter<"User"> | string | null;
    kakaoRefreshToken?: Prisma.StringNullableFilter<"User"> | string | null;
    kakaoTokenExpiry?: Prisma.DateTimeNullableFilter<"User"> | Date | string | null;
    planId?: Prisma.StringNullableFilter<"User"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"User"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"User"> | Date | string;
    plan?: Prisma.XOR<Prisma.PlanNullableScalarRelationFilter, Prisma.PlanWhereInput> | null;
    roles?: Prisma.RoleListRelationFilter;
    accounts?: Prisma.AccountListRelationFilter;
    sessions?: Prisma.SessionListRelationFilter;
    accommodations?: Prisma.AccommodationListRelationFilter;
    checkLogs?: Prisma.CheckLogListRelationFilter;
    settingsChangeLogs?: Prisma.SettingsChangeLogListRelationFilter;
    auditLogs?: Prisma.AuditLogListRelationFilter;
    auditLogsAsTarget?: Prisma.AuditLogListRelationFilter;
    subscriptions?: Prisma.SubscriptionListRelationFilter;
    createdSelectors?: Prisma.PlatformSelectorListRelationFilter;
    updatedSelectors?: Prisma.PlatformSelectorListRelationFilter;
    createdPatterns?: Prisma.PlatformPatternListRelationFilter;
    selectorChangeLogs?: Prisma.SelectorChangeLogListRelationFilter;
}, "id" | "email">;
export type UserOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrderInput | Prisma.SortOrder;
    email?: Prisma.SortOrderInput | Prisma.SortOrder;
    emailVerified?: Prisma.SortOrderInput | Prisma.SortOrder;
    image?: Prisma.SortOrderInput | Prisma.SortOrder;
    password?: Prisma.SortOrderInput | Prisma.SortOrder;
    kakaoAccessToken?: Prisma.SortOrderInput | Prisma.SortOrder;
    kakaoRefreshToken?: Prisma.SortOrderInput | Prisma.SortOrder;
    kakaoTokenExpiry?: Prisma.SortOrderInput | Prisma.SortOrder;
    planId?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.UserCountOrderByAggregateInput;
    _max?: Prisma.UserMaxOrderByAggregateInput;
    _min?: Prisma.UserMinOrderByAggregateInput;
};
export type UserScalarWhereWithAggregatesInput = {
    AND?: Prisma.UserScalarWhereWithAggregatesInput | Prisma.UserScalarWhereWithAggregatesInput[];
    OR?: Prisma.UserScalarWhereWithAggregatesInput[];
    NOT?: Prisma.UserScalarWhereWithAggregatesInput | Prisma.UserScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"User"> | string;
    name?: Prisma.StringNullableWithAggregatesFilter<"User"> | string | null;
    email?: Prisma.StringNullableWithAggregatesFilter<"User"> | string | null;
    emailVerified?: Prisma.DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null;
    image?: Prisma.StringNullableWithAggregatesFilter<"User"> | string | null;
    password?: Prisma.StringNullableWithAggregatesFilter<"User"> | string | null;
    kakaoAccessToken?: Prisma.StringNullableWithAggregatesFilter<"User"> | string | null;
    kakaoRefreshToken?: Prisma.StringNullableWithAggregatesFilter<"User"> | string | null;
    kakaoTokenExpiry?: Prisma.DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null;
    planId?: Prisma.StringNullableWithAggregatesFilter<"User"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"User"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"User"> | Date | string;
};
export type UserCreateInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    plan?: Prisma.PlanCreateNestedOneWithoutUsersInput;
    roles?: Prisma.RoleCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogCreateNestedManyWithoutChangedByInput;
};
export type UserUncheckedCreateInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    planId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    roles?: Prisma.RoleUncheckedCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountUncheckedCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationUncheckedCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogUncheckedCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogUncheckedCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionUncheckedCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
};
export type UserUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    plan?: Prisma.PlanUpdateOneWithoutUsersNestedInput;
    roles?: Prisma.RoleUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUpdateManyWithoutChangedByNestedInput;
};
export type UserUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    planId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roles?: Prisma.RoleUncheckedUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUncheckedUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUncheckedUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUncheckedUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUncheckedUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUncheckedUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
};
export type UserCreateManyInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    planId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type UserUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    planId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserScalarRelationFilter = {
    is?: Prisma.UserWhereInput;
    isNot?: Prisma.UserWhereInput;
};
export type UserCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    emailVerified?: Prisma.SortOrder;
    image?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    kakaoAccessToken?: Prisma.SortOrder;
    kakaoRefreshToken?: Prisma.SortOrder;
    kakaoTokenExpiry?: Prisma.SortOrder;
    planId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type UserMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    emailVerified?: Prisma.SortOrder;
    image?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    kakaoAccessToken?: Prisma.SortOrder;
    kakaoRefreshToken?: Prisma.SortOrder;
    kakaoTokenExpiry?: Prisma.SortOrder;
    planId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type UserMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    emailVerified?: Prisma.SortOrder;
    image?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    kakaoAccessToken?: Prisma.SortOrder;
    kakaoRefreshToken?: Prisma.SortOrder;
    kakaoTokenExpiry?: Prisma.SortOrder;
    planId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type UserListRelationFilter = {
    every?: Prisma.UserWhereInput;
    some?: Prisma.UserWhereInput;
    none?: Prisma.UserWhereInput;
};
export type UserOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type UserNullableScalarRelationFilter = {
    is?: Prisma.UserWhereInput | null;
    isNot?: Prisma.UserWhereInput | null;
};
export type UserCreateNestedOneWithoutAccountsInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutAccountsInput, Prisma.UserUncheckedCreateWithoutAccountsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutAccountsInput;
    connect?: Prisma.UserWhereUniqueInput;
};
export type UserUpdateOneRequiredWithoutAccountsNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutAccountsInput, Prisma.UserUncheckedCreateWithoutAccountsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutAccountsInput;
    upsert?: Prisma.UserUpsertWithoutAccountsInput;
    connect?: Prisma.UserWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UserUpdateToOneWithWhereWithoutAccountsInput, Prisma.UserUpdateWithoutAccountsInput>, Prisma.UserUncheckedUpdateWithoutAccountsInput>;
};
export type UserCreateNestedOneWithoutSessionsInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutSessionsInput, Prisma.UserUncheckedCreateWithoutSessionsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutSessionsInput;
    connect?: Prisma.UserWhereUniqueInput;
};
export type UserUpdateOneRequiredWithoutSessionsNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutSessionsInput, Prisma.UserUncheckedCreateWithoutSessionsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutSessionsInput;
    upsert?: Prisma.UserUpsertWithoutSessionsInput;
    connect?: Prisma.UserWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UserUpdateToOneWithWhereWithoutSessionsInput, Prisma.UserUpdateWithoutSessionsInput>, Prisma.UserUncheckedUpdateWithoutSessionsInput>;
};
export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null;
};
export type UserCreateNestedOneWithoutAccommodationsInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutAccommodationsInput, Prisma.UserUncheckedCreateWithoutAccommodationsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutAccommodationsInput;
    connect?: Prisma.UserWhereUniqueInput;
};
export type UserUpdateOneRequiredWithoutAccommodationsNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutAccommodationsInput, Prisma.UserUncheckedCreateWithoutAccommodationsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutAccommodationsInput;
    upsert?: Prisma.UserUpsertWithoutAccommodationsInput;
    connect?: Prisma.UserWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UserUpdateToOneWithWhereWithoutAccommodationsInput, Prisma.UserUpdateWithoutAccommodationsInput>, Prisma.UserUncheckedUpdateWithoutAccommodationsInput>;
};
export type UserCreateNestedOneWithoutCheckLogsInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutCheckLogsInput, Prisma.UserUncheckedCreateWithoutCheckLogsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutCheckLogsInput;
    connect?: Prisma.UserWhereUniqueInput;
};
export type UserUpdateOneRequiredWithoutCheckLogsNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutCheckLogsInput, Prisma.UserUncheckedCreateWithoutCheckLogsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutCheckLogsInput;
    upsert?: Prisma.UserUpsertWithoutCheckLogsInput;
    connect?: Prisma.UserWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UserUpdateToOneWithWhereWithoutCheckLogsInput, Prisma.UserUpdateWithoutCheckLogsInput>, Prisma.UserUncheckedUpdateWithoutCheckLogsInput>;
};
export type UserCreateNestedOneWithoutSettingsChangeLogsInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutSettingsChangeLogsInput, Prisma.UserUncheckedCreateWithoutSettingsChangeLogsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutSettingsChangeLogsInput;
    connect?: Prisma.UserWhereUniqueInput;
};
export type UserUpdateOneRequiredWithoutSettingsChangeLogsNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutSettingsChangeLogsInput, Prisma.UserUncheckedCreateWithoutSettingsChangeLogsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutSettingsChangeLogsInput;
    upsert?: Prisma.UserUpsertWithoutSettingsChangeLogsInput;
    connect?: Prisma.UserWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UserUpdateToOneWithWhereWithoutSettingsChangeLogsInput, Prisma.UserUpdateWithoutSettingsChangeLogsInput>, Prisma.UserUncheckedUpdateWithoutSettingsChangeLogsInput>;
};
export type UserCreateNestedManyWithoutPlanInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutPlanInput, Prisma.UserUncheckedCreateWithoutPlanInput> | Prisma.UserCreateWithoutPlanInput[] | Prisma.UserUncheckedCreateWithoutPlanInput[];
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutPlanInput | Prisma.UserCreateOrConnectWithoutPlanInput[];
    createMany?: Prisma.UserCreateManyPlanInputEnvelope;
    connect?: Prisma.UserWhereUniqueInput | Prisma.UserWhereUniqueInput[];
};
export type UserUncheckedCreateNestedManyWithoutPlanInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutPlanInput, Prisma.UserUncheckedCreateWithoutPlanInput> | Prisma.UserCreateWithoutPlanInput[] | Prisma.UserUncheckedCreateWithoutPlanInput[];
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutPlanInput | Prisma.UserCreateOrConnectWithoutPlanInput[];
    createMany?: Prisma.UserCreateManyPlanInputEnvelope;
    connect?: Prisma.UserWhereUniqueInput | Prisma.UserWhereUniqueInput[];
};
export type UserUpdateManyWithoutPlanNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutPlanInput, Prisma.UserUncheckedCreateWithoutPlanInput> | Prisma.UserCreateWithoutPlanInput[] | Prisma.UserUncheckedCreateWithoutPlanInput[];
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutPlanInput | Prisma.UserCreateOrConnectWithoutPlanInput[];
    upsert?: Prisma.UserUpsertWithWhereUniqueWithoutPlanInput | Prisma.UserUpsertWithWhereUniqueWithoutPlanInput[];
    createMany?: Prisma.UserCreateManyPlanInputEnvelope;
    set?: Prisma.UserWhereUniqueInput | Prisma.UserWhereUniqueInput[];
    disconnect?: Prisma.UserWhereUniqueInput | Prisma.UserWhereUniqueInput[];
    delete?: Prisma.UserWhereUniqueInput | Prisma.UserWhereUniqueInput[];
    connect?: Prisma.UserWhereUniqueInput | Prisma.UserWhereUniqueInput[];
    update?: Prisma.UserUpdateWithWhereUniqueWithoutPlanInput | Prisma.UserUpdateWithWhereUniqueWithoutPlanInput[];
    updateMany?: Prisma.UserUpdateManyWithWhereWithoutPlanInput | Prisma.UserUpdateManyWithWhereWithoutPlanInput[];
    deleteMany?: Prisma.UserScalarWhereInput | Prisma.UserScalarWhereInput[];
};
export type UserUncheckedUpdateManyWithoutPlanNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutPlanInput, Prisma.UserUncheckedCreateWithoutPlanInput> | Prisma.UserCreateWithoutPlanInput[] | Prisma.UserUncheckedCreateWithoutPlanInput[];
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutPlanInput | Prisma.UserCreateOrConnectWithoutPlanInput[];
    upsert?: Prisma.UserUpsertWithWhereUniqueWithoutPlanInput | Prisma.UserUpsertWithWhereUniqueWithoutPlanInput[];
    createMany?: Prisma.UserCreateManyPlanInputEnvelope;
    set?: Prisma.UserWhereUniqueInput | Prisma.UserWhereUniqueInput[];
    disconnect?: Prisma.UserWhereUniqueInput | Prisma.UserWhereUniqueInput[];
    delete?: Prisma.UserWhereUniqueInput | Prisma.UserWhereUniqueInput[];
    connect?: Prisma.UserWhereUniqueInput | Prisma.UserWhereUniqueInput[];
    update?: Prisma.UserUpdateWithWhereUniqueWithoutPlanInput | Prisma.UserUpdateWithWhereUniqueWithoutPlanInput[];
    updateMany?: Prisma.UserUpdateManyWithWhereWithoutPlanInput | Prisma.UserUpdateManyWithWhereWithoutPlanInput[];
    deleteMany?: Prisma.UserScalarWhereInput | Prisma.UserScalarWhereInput[];
};
export type UserCreateNestedManyWithoutRolesInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutRolesInput, Prisma.UserUncheckedCreateWithoutRolesInput> | Prisma.UserCreateWithoutRolesInput[] | Prisma.UserUncheckedCreateWithoutRolesInput[];
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutRolesInput | Prisma.UserCreateOrConnectWithoutRolesInput[];
    connect?: Prisma.UserWhereUniqueInput | Prisma.UserWhereUniqueInput[];
};
export type UserUncheckedCreateNestedManyWithoutRolesInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutRolesInput, Prisma.UserUncheckedCreateWithoutRolesInput> | Prisma.UserCreateWithoutRolesInput[] | Prisma.UserUncheckedCreateWithoutRolesInput[];
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutRolesInput | Prisma.UserCreateOrConnectWithoutRolesInput[];
    connect?: Prisma.UserWhereUniqueInput | Prisma.UserWhereUniqueInput[];
};
export type UserUpdateManyWithoutRolesNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutRolesInput, Prisma.UserUncheckedCreateWithoutRolesInput> | Prisma.UserCreateWithoutRolesInput[] | Prisma.UserUncheckedCreateWithoutRolesInput[];
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutRolesInput | Prisma.UserCreateOrConnectWithoutRolesInput[];
    upsert?: Prisma.UserUpsertWithWhereUniqueWithoutRolesInput | Prisma.UserUpsertWithWhereUniqueWithoutRolesInput[];
    set?: Prisma.UserWhereUniqueInput | Prisma.UserWhereUniqueInput[];
    disconnect?: Prisma.UserWhereUniqueInput | Prisma.UserWhereUniqueInput[];
    delete?: Prisma.UserWhereUniqueInput | Prisma.UserWhereUniqueInput[];
    connect?: Prisma.UserWhereUniqueInput | Prisma.UserWhereUniqueInput[];
    update?: Prisma.UserUpdateWithWhereUniqueWithoutRolesInput | Prisma.UserUpdateWithWhereUniqueWithoutRolesInput[];
    updateMany?: Prisma.UserUpdateManyWithWhereWithoutRolesInput | Prisma.UserUpdateManyWithWhereWithoutRolesInput[];
    deleteMany?: Prisma.UserScalarWhereInput | Prisma.UserScalarWhereInput[];
};
export type UserUncheckedUpdateManyWithoutRolesNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutRolesInput, Prisma.UserUncheckedCreateWithoutRolesInput> | Prisma.UserCreateWithoutRolesInput[] | Prisma.UserUncheckedCreateWithoutRolesInput[];
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutRolesInput | Prisma.UserCreateOrConnectWithoutRolesInput[];
    upsert?: Prisma.UserUpsertWithWhereUniqueWithoutRolesInput | Prisma.UserUpsertWithWhereUniqueWithoutRolesInput[];
    set?: Prisma.UserWhereUniqueInput | Prisma.UserWhereUniqueInput[];
    disconnect?: Prisma.UserWhereUniqueInput | Prisma.UserWhereUniqueInput[];
    delete?: Prisma.UserWhereUniqueInput | Prisma.UserWhereUniqueInput[];
    connect?: Prisma.UserWhereUniqueInput | Prisma.UserWhereUniqueInput[];
    update?: Prisma.UserUpdateWithWhereUniqueWithoutRolesInput | Prisma.UserUpdateWithWhereUniqueWithoutRolesInput[];
    updateMany?: Prisma.UserUpdateManyWithWhereWithoutRolesInput | Prisma.UserUpdateManyWithWhereWithoutRolesInput[];
    deleteMany?: Prisma.UserScalarWhereInput | Prisma.UserScalarWhereInput[];
};
export type UserCreateNestedOneWithoutAuditLogsInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutAuditLogsInput, Prisma.UserUncheckedCreateWithoutAuditLogsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutAuditLogsInput;
    connect?: Prisma.UserWhereUniqueInput;
};
export type UserCreateNestedOneWithoutAuditLogsAsTargetInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutAuditLogsAsTargetInput, Prisma.UserUncheckedCreateWithoutAuditLogsAsTargetInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutAuditLogsAsTargetInput;
    connect?: Prisma.UserWhereUniqueInput;
};
export type UserUpdateOneWithoutAuditLogsNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutAuditLogsInput, Prisma.UserUncheckedCreateWithoutAuditLogsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutAuditLogsInput;
    upsert?: Prisma.UserUpsertWithoutAuditLogsInput;
    disconnect?: Prisma.UserWhereInput | boolean;
    delete?: Prisma.UserWhereInput | boolean;
    connect?: Prisma.UserWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UserUpdateToOneWithWhereWithoutAuditLogsInput, Prisma.UserUpdateWithoutAuditLogsInput>, Prisma.UserUncheckedUpdateWithoutAuditLogsInput>;
};
export type UserUpdateOneWithoutAuditLogsAsTargetNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutAuditLogsAsTargetInput, Prisma.UserUncheckedCreateWithoutAuditLogsAsTargetInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutAuditLogsAsTargetInput;
    upsert?: Prisma.UserUpsertWithoutAuditLogsAsTargetInput;
    disconnect?: Prisma.UserWhereInput | boolean;
    delete?: Prisma.UserWhereInput | boolean;
    connect?: Prisma.UserWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UserUpdateToOneWithWhereWithoutAuditLogsAsTargetInput, Prisma.UserUpdateWithoutAuditLogsAsTargetInput>, Prisma.UserUncheckedUpdateWithoutAuditLogsAsTargetInput>;
};
export type UserCreateNestedOneWithoutSubscriptionsInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutSubscriptionsInput, Prisma.UserUncheckedCreateWithoutSubscriptionsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutSubscriptionsInput;
    connect?: Prisma.UserWhereUniqueInput;
};
export type UserUpdateOneRequiredWithoutSubscriptionsNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutSubscriptionsInput, Prisma.UserUncheckedCreateWithoutSubscriptionsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutSubscriptionsInput;
    upsert?: Prisma.UserUpsertWithoutSubscriptionsInput;
    connect?: Prisma.UserWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UserUpdateToOneWithWhereWithoutSubscriptionsInput, Prisma.UserUpdateWithoutSubscriptionsInput>, Prisma.UserUncheckedUpdateWithoutSubscriptionsInput>;
};
export type UserCreateNestedOneWithoutCreatedSelectorsInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutCreatedSelectorsInput, Prisma.UserUncheckedCreateWithoutCreatedSelectorsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutCreatedSelectorsInput;
    connect?: Prisma.UserWhereUniqueInput;
};
export type UserCreateNestedOneWithoutUpdatedSelectorsInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutUpdatedSelectorsInput, Prisma.UserUncheckedCreateWithoutUpdatedSelectorsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutUpdatedSelectorsInput;
    connect?: Prisma.UserWhereUniqueInput;
};
export type UserUpdateOneWithoutCreatedSelectorsNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutCreatedSelectorsInput, Prisma.UserUncheckedCreateWithoutCreatedSelectorsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutCreatedSelectorsInput;
    upsert?: Prisma.UserUpsertWithoutCreatedSelectorsInput;
    disconnect?: Prisma.UserWhereInput | boolean;
    delete?: Prisma.UserWhereInput | boolean;
    connect?: Prisma.UserWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UserUpdateToOneWithWhereWithoutCreatedSelectorsInput, Prisma.UserUpdateWithoutCreatedSelectorsInput>, Prisma.UserUncheckedUpdateWithoutCreatedSelectorsInput>;
};
export type UserUpdateOneWithoutUpdatedSelectorsNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutUpdatedSelectorsInput, Prisma.UserUncheckedCreateWithoutUpdatedSelectorsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutUpdatedSelectorsInput;
    upsert?: Prisma.UserUpsertWithoutUpdatedSelectorsInput;
    disconnect?: Prisma.UserWhereInput | boolean;
    delete?: Prisma.UserWhereInput | boolean;
    connect?: Prisma.UserWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UserUpdateToOneWithWhereWithoutUpdatedSelectorsInput, Prisma.UserUpdateWithoutUpdatedSelectorsInput>, Prisma.UserUncheckedUpdateWithoutUpdatedSelectorsInput>;
};
export type UserCreateNestedOneWithoutCreatedPatternsInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutCreatedPatternsInput, Prisma.UserUncheckedCreateWithoutCreatedPatternsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutCreatedPatternsInput;
    connect?: Prisma.UserWhereUniqueInput;
};
export type UserUpdateOneWithoutCreatedPatternsNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutCreatedPatternsInput, Prisma.UserUncheckedCreateWithoutCreatedPatternsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutCreatedPatternsInput;
    upsert?: Prisma.UserUpsertWithoutCreatedPatternsInput;
    disconnect?: Prisma.UserWhereInput | boolean;
    delete?: Prisma.UserWhereInput | boolean;
    connect?: Prisma.UserWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UserUpdateToOneWithWhereWithoutCreatedPatternsInput, Prisma.UserUpdateWithoutCreatedPatternsInput>, Prisma.UserUncheckedUpdateWithoutCreatedPatternsInput>;
};
export type UserCreateNestedOneWithoutSelectorChangeLogsInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutSelectorChangeLogsInput, Prisma.UserUncheckedCreateWithoutSelectorChangeLogsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutSelectorChangeLogsInput;
    connect?: Prisma.UserWhereUniqueInput;
};
export type UserUpdateOneRequiredWithoutSelectorChangeLogsNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutSelectorChangeLogsInput, Prisma.UserUncheckedCreateWithoutSelectorChangeLogsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutSelectorChangeLogsInput;
    upsert?: Prisma.UserUpsertWithoutSelectorChangeLogsInput;
    connect?: Prisma.UserWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UserUpdateToOneWithWhereWithoutSelectorChangeLogsInput, Prisma.UserUpdateWithoutSelectorChangeLogsInput>, Prisma.UserUncheckedUpdateWithoutSelectorChangeLogsInput>;
};
export type UserCreateWithoutAccountsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    plan?: Prisma.PlanCreateNestedOneWithoutUsersInput;
    roles?: Prisma.RoleCreateNestedManyWithoutUsersInput;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogCreateNestedManyWithoutChangedByInput;
};
export type UserUncheckedCreateWithoutAccountsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    planId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    roles?: Prisma.RoleUncheckedCreateNestedManyWithoutUsersInput;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationUncheckedCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogUncheckedCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogUncheckedCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionUncheckedCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
};
export type UserCreateOrConnectWithoutAccountsInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutAccountsInput, Prisma.UserUncheckedCreateWithoutAccountsInput>;
};
export type UserUpsertWithoutAccountsInput = {
    update: Prisma.XOR<Prisma.UserUpdateWithoutAccountsInput, Prisma.UserUncheckedUpdateWithoutAccountsInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutAccountsInput, Prisma.UserUncheckedCreateWithoutAccountsInput>;
    where?: Prisma.UserWhereInput;
};
export type UserUpdateToOneWithWhereWithoutAccountsInput = {
    where?: Prisma.UserWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutAccountsInput, Prisma.UserUncheckedUpdateWithoutAccountsInput>;
};
export type UserUpdateWithoutAccountsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    plan?: Prisma.PlanUpdateOneWithoutUsersNestedInput;
    roles?: Prisma.RoleUpdateManyWithoutUsersNestedInput;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUpdateManyWithoutChangedByNestedInput;
};
export type UserUncheckedUpdateWithoutAccountsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    planId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roles?: Prisma.RoleUncheckedUpdateManyWithoutUsersNestedInput;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUncheckedUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUncheckedUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUncheckedUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUncheckedUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
};
export type UserCreateWithoutSessionsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    plan?: Prisma.PlanCreateNestedOneWithoutUsersInput;
    roles?: Prisma.RoleCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogCreateNestedManyWithoutChangedByInput;
};
export type UserUncheckedCreateWithoutSessionsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    planId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    roles?: Prisma.RoleUncheckedCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountUncheckedCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationUncheckedCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogUncheckedCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogUncheckedCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionUncheckedCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
};
export type UserCreateOrConnectWithoutSessionsInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutSessionsInput, Prisma.UserUncheckedCreateWithoutSessionsInput>;
};
export type UserUpsertWithoutSessionsInput = {
    update: Prisma.XOR<Prisma.UserUpdateWithoutSessionsInput, Prisma.UserUncheckedUpdateWithoutSessionsInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutSessionsInput, Prisma.UserUncheckedCreateWithoutSessionsInput>;
    where?: Prisma.UserWhereInput;
};
export type UserUpdateToOneWithWhereWithoutSessionsInput = {
    where?: Prisma.UserWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutSessionsInput, Prisma.UserUncheckedUpdateWithoutSessionsInput>;
};
export type UserUpdateWithoutSessionsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    plan?: Prisma.PlanUpdateOneWithoutUsersNestedInput;
    roles?: Prisma.RoleUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUpdateManyWithoutChangedByNestedInput;
};
export type UserUncheckedUpdateWithoutSessionsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    planId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roles?: Prisma.RoleUncheckedUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUncheckedUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUncheckedUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUncheckedUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUncheckedUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUncheckedUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
};
export type UserCreateWithoutAccommodationsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    plan?: Prisma.PlanCreateNestedOneWithoutUsersInput;
    roles?: Prisma.RoleCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogCreateNestedManyWithoutChangedByInput;
};
export type UserUncheckedCreateWithoutAccommodationsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    planId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    roles?: Prisma.RoleUncheckedCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountUncheckedCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogUncheckedCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogUncheckedCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionUncheckedCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
};
export type UserCreateOrConnectWithoutAccommodationsInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutAccommodationsInput, Prisma.UserUncheckedCreateWithoutAccommodationsInput>;
};
export type UserUpsertWithoutAccommodationsInput = {
    update: Prisma.XOR<Prisma.UserUpdateWithoutAccommodationsInput, Prisma.UserUncheckedUpdateWithoutAccommodationsInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutAccommodationsInput, Prisma.UserUncheckedCreateWithoutAccommodationsInput>;
    where?: Prisma.UserWhereInput;
};
export type UserUpdateToOneWithWhereWithoutAccommodationsInput = {
    where?: Prisma.UserWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutAccommodationsInput, Prisma.UserUncheckedUpdateWithoutAccommodationsInput>;
};
export type UserUpdateWithoutAccommodationsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    plan?: Prisma.PlanUpdateOneWithoutUsersNestedInput;
    roles?: Prisma.RoleUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUpdateManyWithoutChangedByNestedInput;
};
export type UserUncheckedUpdateWithoutAccommodationsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    planId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roles?: Prisma.RoleUncheckedUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUncheckedUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUncheckedUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUncheckedUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUncheckedUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
};
export type UserCreateWithoutCheckLogsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    plan?: Prisma.PlanCreateNestedOneWithoutUsersInput;
    roles?: Prisma.RoleCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogCreateNestedManyWithoutChangedByInput;
};
export type UserUncheckedCreateWithoutCheckLogsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    planId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    roles?: Prisma.RoleUncheckedCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountUncheckedCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationUncheckedCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogUncheckedCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionUncheckedCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
};
export type UserCreateOrConnectWithoutCheckLogsInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutCheckLogsInput, Prisma.UserUncheckedCreateWithoutCheckLogsInput>;
};
export type UserUpsertWithoutCheckLogsInput = {
    update: Prisma.XOR<Prisma.UserUpdateWithoutCheckLogsInput, Prisma.UserUncheckedUpdateWithoutCheckLogsInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutCheckLogsInput, Prisma.UserUncheckedCreateWithoutCheckLogsInput>;
    where?: Prisma.UserWhereInput;
};
export type UserUpdateToOneWithWhereWithoutCheckLogsInput = {
    where?: Prisma.UserWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutCheckLogsInput, Prisma.UserUncheckedUpdateWithoutCheckLogsInput>;
};
export type UserUpdateWithoutCheckLogsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    plan?: Prisma.PlanUpdateOneWithoutUsersNestedInput;
    roles?: Prisma.RoleUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUpdateManyWithoutChangedByNestedInput;
};
export type UserUncheckedUpdateWithoutCheckLogsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    planId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roles?: Prisma.RoleUncheckedUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUncheckedUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUncheckedUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUncheckedUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUncheckedUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
};
export type UserCreateWithoutSettingsChangeLogsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    plan?: Prisma.PlanCreateNestedOneWithoutUsersInput;
    roles?: Prisma.RoleCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogCreateNestedManyWithoutUserInput;
    auditLogs?: Prisma.AuditLogCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogCreateNestedManyWithoutChangedByInput;
};
export type UserUncheckedCreateWithoutSettingsChangeLogsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    planId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    roles?: Prisma.RoleUncheckedCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountUncheckedCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationUncheckedCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogUncheckedCreateNestedManyWithoutUserInput;
    auditLogs?: Prisma.AuditLogUncheckedCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionUncheckedCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
};
export type UserCreateOrConnectWithoutSettingsChangeLogsInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutSettingsChangeLogsInput, Prisma.UserUncheckedCreateWithoutSettingsChangeLogsInput>;
};
export type UserUpsertWithoutSettingsChangeLogsInput = {
    update: Prisma.XOR<Prisma.UserUpdateWithoutSettingsChangeLogsInput, Prisma.UserUncheckedUpdateWithoutSettingsChangeLogsInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutSettingsChangeLogsInput, Prisma.UserUncheckedCreateWithoutSettingsChangeLogsInput>;
    where?: Prisma.UserWhereInput;
};
export type UserUpdateToOneWithWhereWithoutSettingsChangeLogsInput = {
    where?: Prisma.UserWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutSettingsChangeLogsInput, Prisma.UserUncheckedUpdateWithoutSettingsChangeLogsInput>;
};
export type UserUpdateWithoutSettingsChangeLogsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    plan?: Prisma.PlanUpdateOneWithoutUsersNestedInput;
    roles?: Prisma.RoleUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUpdateManyWithoutUserNestedInput;
    auditLogs?: Prisma.AuditLogUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUpdateManyWithoutChangedByNestedInput;
};
export type UserUncheckedUpdateWithoutSettingsChangeLogsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    planId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roles?: Prisma.RoleUncheckedUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUncheckedUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUncheckedUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUncheckedUpdateManyWithoutUserNestedInput;
    auditLogs?: Prisma.AuditLogUncheckedUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUncheckedUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
};
export type UserCreateWithoutPlanInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    roles?: Prisma.RoleCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogCreateNestedManyWithoutChangedByInput;
};
export type UserUncheckedCreateWithoutPlanInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    roles?: Prisma.RoleUncheckedCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountUncheckedCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationUncheckedCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogUncheckedCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogUncheckedCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionUncheckedCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
};
export type UserCreateOrConnectWithoutPlanInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutPlanInput, Prisma.UserUncheckedCreateWithoutPlanInput>;
};
export type UserCreateManyPlanInputEnvelope = {
    data: Prisma.UserCreateManyPlanInput | Prisma.UserCreateManyPlanInput[];
    skipDuplicates?: boolean;
};
export type UserUpsertWithWhereUniqueWithoutPlanInput = {
    where: Prisma.UserWhereUniqueInput;
    update: Prisma.XOR<Prisma.UserUpdateWithoutPlanInput, Prisma.UserUncheckedUpdateWithoutPlanInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutPlanInput, Prisma.UserUncheckedCreateWithoutPlanInput>;
};
export type UserUpdateWithWhereUniqueWithoutPlanInput = {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutPlanInput, Prisma.UserUncheckedUpdateWithoutPlanInput>;
};
export type UserUpdateManyWithWhereWithoutPlanInput = {
    where: Prisma.UserScalarWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateManyMutationInput, Prisma.UserUncheckedUpdateManyWithoutPlanInput>;
};
export type UserScalarWhereInput = {
    AND?: Prisma.UserScalarWhereInput | Prisma.UserScalarWhereInput[];
    OR?: Prisma.UserScalarWhereInput[];
    NOT?: Prisma.UserScalarWhereInput | Prisma.UserScalarWhereInput[];
    id?: Prisma.StringFilter<"User"> | string;
    name?: Prisma.StringNullableFilter<"User"> | string | null;
    email?: Prisma.StringNullableFilter<"User"> | string | null;
    emailVerified?: Prisma.DateTimeNullableFilter<"User"> | Date | string | null;
    image?: Prisma.StringNullableFilter<"User"> | string | null;
    password?: Prisma.StringNullableFilter<"User"> | string | null;
    kakaoAccessToken?: Prisma.StringNullableFilter<"User"> | string | null;
    kakaoRefreshToken?: Prisma.StringNullableFilter<"User"> | string | null;
    kakaoTokenExpiry?: Prisma.DateTimeNullableFilter<"User"> | Date | string | null;
    planId?: Prisma.StringNullableFilter<"User"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"User"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"User"> | Date | string;
};
export type UserCreateWithoutRolesInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    plan?: Prisma.PlanCreateNestedOneWithoutUsersInput;
    accounts?: Prisma.AccountCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogCreateNestedManyWithoutChangedByInput;
};
export type UserUncheckedCreateWithoutRolesInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    planId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    accounts?: Prisma.AccountUncheckedCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationUncheckedCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogUncheckedCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogUncheckedCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionUncheckedCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
};
export type UserCreateOrConnectWithoutRolesInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutRolesInput, Prisma.UserUncheckedCreateWithoutRolesInput>;
};
export type UserUpsertWithWhereUniqueWithoutRolesInput = {
    where: Prisma.UserWhereUniqueInput;
    update: Prisma.XOR<Prisma.UserUpdateWithoutRolesInput, Prisma.UserUncheckedUpdateWithoutRolesInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutRolesInput, Prisma.UserUncheckedCreateWithoutRolesInput>;
};
export type UserUpdateWithWhereUniqueWithoutRolesInput = {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutRolesInput, Prisma.UserUncheckedUpdateWithoutRolesInput>;
};
export type UserUpdateManyWithWhereWithoutRolesInput = {
    where: Prisma.UserScalarWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateManyMutationInput, Prisma.UserUncheckedUpdateManyWithoutRolesInput>;
};
export type UserCreateWithoutAuditLogsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    plan?: Prisma.PlanCreateNestedOneWithoutUsersInput;
    roles?: Prisma.RoleCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogCreateNestedManyWithoutChangedByInput;
    auditLogsAsTarget?: Prisma.AuditLogCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogCreateNestedManyWithoutChangedByInput;
};
export type UserUncheckedCreateWithoutAuditLogsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    planId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    roles?: Prisma.RoleUncheckedCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountUncheckedCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationUncheckedCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogUncheckedCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionUncheckedCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
};
export type UserCreateOrConnectWithoutAuditLogsInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutAuditLogsInput, Prisma.UserUncheckedCreateWithoutAuditLogsInput>;
};
export type UserCreateWithoutAuditLogsAsTargetInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    plan?: Prisma.PlanCreateNestedOneWithoutUsersInput;
    roles?: Prisma.RoleCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogCreateNestedManyWithoutActorInput;
    subscriptions?: Prisma.SubscriptionCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogCreateNestedManyWithoutChangedByInput;
};
export type UserUncheckedCreateWithoutAuditLogsAsTargetInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    planId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    roles?: Prisma.RoleUncheckedCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountUncheckedCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationUncheckedCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogUncheckedCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogUncheckedCreateNestedManyWithoutActorInput;
    subscriptions?: Prisma.SubscriptionUncheckedCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
};
export type UserCreateOrConnectWithoutAuditLogsAsTargetInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutAuditLogsAsTargetInput, Prisma.UserUncheckedCreateWithoutAuditLogsAsTargetInput>;
};
export type UserUpsertWithoutAuditLogsInput = {
    update: Prisma.XOR<Prisma.UserUpdateWithoutAuditLogsInput, Prisma.UserUncheckedUpdateWithoutAuditLogsInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutAuditLogsInput, Prisma.UserUncheckedCreateWithoutAuditLogsInput>;
    where?: Prisma.UserWhereInput;
};
export type UserUpdateToOneWithWhereWithoutAuditLogsInput = {
    where?: Prisma.UserWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutAuditLogsInput, Prisma.UserUncheckedUpdateWithoutAuditLogsInput>;
};
export type UserUpdateWithoutAuditLogsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    plan?: Prisma.PlanUpdateOneWithoutUsersNestedInput;
    roles?: Prisma.RoleUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUpdateManyWithoutChangedByNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUpdateManyWithoutChangedByNestedInput;
};
export type UserUncheckedUpdateWithoutAuditLogsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    planId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roles?: Prisma.RoleUncheckedUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUncheckedUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUncheckedUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUncheckedUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUncheckedUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
};
export type UserUpsertWithoutAuditLogsAsTargetInput = {
    update: Prisma.XOR<Prisma.UserUpdateWithoutAuditLogsAsTargetInput, Prisma.UserUncheckedUpdateWithoutAuditLogsAsTargetInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutAuditLogsAsTargetInput, Prisma.UserUncheckedCreateWithoutAuditLogsAsTargetInput>;
    where?: Prisma.UserWhereInput;
};
export type UserUpdateToOneWithWhereWithoutAuditLogsAsTargetInput = {
    where?: Prisma.UserWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutAuditLogsAsTargetInput, Prisma.UserUncheckedUpdateWithoutAuditLogsAsTargetInput>;
};
export type UserUpdateWithoutAuditLogsAsTargetInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    plan?: Prisma.PlanUpdateOneWithoutUsersNestedInput;
    roles?: Prisma.RoleUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUpdateManyWithoutActorNestedInput;
    subscriptions?: Prisma.SubscriptionUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUpdateManyWithoutChangedByNestedInput;
};
export type UserUncheckedUpdateWithoutAuditLogsAsTargetInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    planId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roles?: Prisma.RoleUncheckedUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUncheckedUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUncheckedUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUncheckedUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUncheckedUpdateManyWithoutActorNestedInput;
    subscriptions?: Prisma.SubscriptionUncheckedUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
};
export type UserCreateWithoutSubscriptionsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    plan?: Prisma.PlanCreateNestedOneWithoutUsersInput;
    roles?: Prisma.RoleCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogCreateNestedManyWithoutTargetUserInput;
    createdSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogCreateNestedManyWithoutChangedByInput;
};
export type UserUncheckedCreateWithoutSubscriptionsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    planId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    roles?: Prisma.RoleUncheckedCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountUncheckedCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationUncheckedCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogUncheckedCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogUncheckedCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedCreateNestedManyWithoutTargetUserInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
};
export type UserCreateOrConnectWithoutSubscriptionsInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutSubscriptionsInput, Prisma.UserUncheckedCreateWithoutSubscriptionsInput>;
};
export type UserUpsertWithoutSubscriptionsInput = {
    update: Prisma.XOR<Prisma.UserUpdateWithoutSubscriptionsInput, Prisma.UserUncheckedUpdateWithoutSubscriptionsInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutSubscriptionsInput, Prisma.UserUncheckedCreateWithoutSubscriptionsInput>;
    where?: Prisma.UserWhereInput;
};
export type UserUpdateToOneWithWhereWithoutSubscriptionsInput = {
    where?: Prisma.UserWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutSubscriptionsInput, Prisma.UserUncheckedUpdateWithoutSubscriptionsInput>;
};
export type UserUpdateWithoutSubscriptionsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    plan?: Prisma.PlanUpdateOneWithoutUsersNestedInput;
    roles?: Prisma.RoleUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUpdateManyWithoutTargetUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUpdateManyWithoutChangedByNestedInput;
};
export type UserUncheckedUpdateWithoutSubscriptionsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    planId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roles?: Prisma.RoleUncheckedUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUncheckedUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUncheckedUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUncheckedUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUncheckedUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedUpdateManyWithoutTargetUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
};
export type UserCreateWithoutCreatedSelectorsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    plan?: Prisma.PlanCreateNestedOneWithoutUsersInput;
    roles?: Prisma.RoleCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionCreateNestedManyWithoutUserInput;
    updatedSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogCreateNestedManyWithoutChangedByInput;
};
export type UserUncheckedCreateWithoutCreatedSelectorsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    planId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    roles?: Prisma.RoleUncheckedCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountUncheckedCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationUncheckedCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogUncheckedCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogUncheckedCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionUncheckedCreateNestedManyWithoutUserInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
};
export type UserCreateOrConnectWithoutCreatedSelectorsInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutCreatedSelectorsInput, Prisma.UserUncheckedCreateWithoutCreatedSelectorsInput>;
};
export type UserCreateWithoutUpdatedSelectorsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    plan?: Prisma.PlanCreateNestedOneWithoutUsersInput;
    roles?: Prisma.RoleCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutCreatedByInput;
    createdPatterns?: Prisma.PlatformPatternCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogCreateNestedManyWithoutChangedByInput;
};
export type UserUncheckedCreateWithoutUpdatedSelectorsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    planId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    roles?: Prisma.RoleUncheckedCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountUncheckedCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationUncheckedCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogUncheckedCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogUncheckedCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionUncheckedCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutCreatedByInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedCreateNestedManyWithoutCreatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
};
export type UserCreateOrConnectWithoutUpdatedSelectorsInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutUpdatedSelectorsInput, Prisma.UserUncheckedCreateWithoutUpdatedSelectorsInput>;
};
export type UserUpsertWithoutCreatedSelectorsInput = {
    update: Prisma.XOR<Prisma.UserUpdateWithoutCreatedSelectorsInput, Prisma.UserUncheckedUpdateWithoutCreatedSelectorsInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutCreatedSelectorsInput, Prisma.UserUncheckedCreateWithoutCreatedSelectorsInput>;
    where?: Prisma.UserWhereInput;
};
export type UserUpdateToOneWithWhereWithoutCreatedSelectorsInput = {
    where?: Prisma.UserWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutCreatedSelectorsInput, Prisma.UserUncheckedUpdateWithoutCreatedSelectorsInput>;
};
export type UserUpdateWithoutCreatedSelectorsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    plan?: Prisma.PlanUpdateOneWithoutUsersNestedInput;
    roles?: Prisma.RoleUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUpdateManyWithoutUserNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUpdateManyWithoutChangedByNestedInput;
};
export type UserUncheckedUpdateWithoutCreatedSelectorsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    planId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roles?: Prisma.RoleUncheckedUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUncheckedUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUncheckedUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUncheckedUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUncheckedUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUncheckedUpdateManyWithoutUserNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
};
export type UserUpsertWithoutUpdatedSelectorsInput = {
    update: Prisma.XOR<Prisma.UserUpdateWithoutUpdatedSelectorsInput, Prisma.UserUncheckedUpdateWithoutUpdatedSelectorsInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutUpdatedSelectorsInput, Prisma.UserUncheckedCreateWithoutUpdatedSelectorsInput>;
    where?: Prisma.UserWhereInput;
};
export type UserUpdateToOneWithWhereWithoutUpdatedSelectorsInput = {
    where?: Prisma.UserWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutUpdatedSelectorsInput, Prisma.UserUncheckedUpdateWithoutUpdatedSelectorsInput>;
};
export type UserUpdateWithoutUpdatedSelectorsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    plan?: Prisma.PlanUpdateOneWithoutUsersNestedInput;
    roles?: Prisma.RoleUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUpdateManyWithoutCreatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUpdateManyWithoutChangedByNestedInput;
};
export type UserUncheckedUpdateWithoutUpdatedSelectorsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    planId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roles?: Prisma.RoleUncheckedUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUncheckedUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUncheckedUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUncheckedUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUncheckedUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUncheckedUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutCreatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
};
export type UserCreateWithoutCreatedPatternsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    plan?: Prisma.PlanCreateNestedOneWithoutUsersInput;
    roles?: Prisma.RoleCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutUpdatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogCreateNestedManyWithoutChangedByInput;
};
export type UserUncheckedCreateWithoutCreatedPatternsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    planId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    roles?: Prisma.RoleUncheckedCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountUncheckedCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationUncheckedCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogUncheckedCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogUncheckedCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionUncheckedCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutUpdatedByInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
};
export type UserCreateOrConnectWithoutCreatedPatternsInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutCreatedPatternsInput, Prisma.UserUncheckedCreateWithoutCreatedPatternsInput>;
};
export type UserUpsertWithoutCreatedPatternsInput = {
    update: Prisma.XOR<Prisma.UserUpdateWithoutCreatedPatternsInput, Prisma.UserUncheckedUpdateWithoutCreatedPatternsInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutCreatedPatternsInput, Prisma.UserUncheckedCreateWithoutCreatedPatternsInput>;
    where?: Prisma.UserWhereInput;
};
export type UserUpdateToOneWithWhereWithoutCreatedPatternsInput = {
    where?: Prisma.UserWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutCreatedPatternsInput, Prisma.UserUncheckedUpdateWithoutCreatedPatternsInput>;
};
export type UserUpdateWithoutCreatedPatternsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    plan?: Prisma.PlanUpdateOneWithoutUsersNestedInput;
    roles?: Prisma.RoleUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUpdateManyWithoutUpdatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUpdateManyWithoutChangedByNestedInput;
};
export type UserUncheckedUpdateWithoutCreatedPatternsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    planId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roles?: Prisma.RoleUncheckedUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUncheckedUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUncheckedUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUncheckedUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUncheckedUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUncheckedUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutUpdatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
};
export type UserCreateWithoutSelectorChangeLogsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    plan?: Prisma.PlanCreateNestedOneWithoutUsersInput;
    roles?: Prisma.RoleCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternCreateNestedManyWithoutCreatedByInput;
};
export type UserUncheckedCreateWithoutSelectorChangeLogsInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    planId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    roles?: Prisma.RoleUncheckedCreateNestedManyWithoutUsersInput;
    accounts?: Prisma.AccountUncheckedCreateNestedManyWithoutUserInput;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    accommodations?: Prisma.AccommodationUncheckedCreateNestedManyWithoutUserInput;
    checkLogs?: Prisma.CheckLogUncheckedCreateNestedManyWithoutUserInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedCreateNestedManyWithoutChangedByInput;
    auditLogs?: Prisma.AuditLogUncheckedCreateNestedManyWithoutActorInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedCreateNestedManyWithoutTargetUserInput;
    subscriptions?: Prisma.SubscriptionUncheckedCreateNestedManyWithoutUserInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutCreatedByInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedCreateNestedManyWithoutUpdatedByInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedCreateNestedManyWithoutCreatedByInput;
};
export type UserCreateOrConnectWithoutSelectorChangeLogsInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutSelectorChangeLogsInput, Prisma.UserUncheckedCreateWithoutSelectorChangeLogsInput>;
};
export type UserUpsertWithoutSelectorChangeLogsInput = {
    update: Prisma.XOR<Prisma.UserUpdateWithoutSelectorChangeLogsInput, Prisma.UserUncheckedUpdateWithoutSelectorChangeLogsInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutSelectorChangeLogsInput, Prisma.UserUncheckedCreateWithoutSelectorChangeLogsInput>;
    where?: Prisma.UserWhereInput;
};
export type UserUpdateToOneWithWhereWithoutSelectorChangeLogsInput = {
    where?: Prisma.UserWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutSelectorChangeLogsInput, Prisma.UserUncheckedUpdateWithoutSelectorChangeLogsInput>;
};
export type UserUpdateWithoutSelectorChangeLogsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    plan?: Prisma.PlanUpdateOneWithoutUsersNestedInput;
    roles?: Prisma.RoleUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUpdateManyWithoutCreatedByNestedInput;
};
export type UserUncheckedUpdateWithoutSelectorChangeLogsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    planId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roles?: Prisma.RoleUncheckedUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUncheckedUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUncheckedUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUncheckedUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUncheckedUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUncheckedUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedUpdateManyWithoutCreatedByNestedInput;
};
export type UserCreateManyPlanInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | string | null;
    image?: string | null;
    password?: string | null;
    kakaoAccessToken?: string | null;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type UserUpdateWithoutPlanInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roles?: Prisma.RoleUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUpdateManyWithoutChangedByNestedInput;
};
export type UserUncheckedUpdateWithoutPlanInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roles?: Prisma.RoleUncheckedUpdateManyWithoutUsersNestedInput;
    accounts?: Prisma.AccountUncheckedUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUncheckedUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUncheckedUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUncheckedUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUncheckedUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
};
export type UserUncheckedUpdateManyWithoutPlanInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserUpdateWithoutRolesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    plan?: Prisma.PlanUpdateOneWithoutUsersNestedInput;
    accounts?: Prisma.AccountUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUpdateManyWithoutChangedByNestedInput;
};
export type UserUncheckedUpdateWithoutRolesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    planId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    accounts?: Prisma.AccountUncheckedUpdateManyWithoutUserNestedInput;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    accommodations?: Prisma.AccommodationUncheckedUpdateManyWithoutUserNestedInput;
    checkLogs?: Prisma.CheckLogUncheckedUpdateManyWithoutUserNestedInput;
    settingsChangeLogs?: Prisma.SettingsChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
    auditLogs?: Prisma.AuditLogUncheckedUpdateManyWithoutActorNestedInput;
    auditLogsAsTarget?: Prisma.AuditLogUncheckedUpdateManyWithoutTargetUserNestedInput;
    subscriptions?: Prisma.SubscriptionUncheckedUpdateManyWithoutUserNestedInput;
    createdSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutCreatedByNestedInput;
    updatedSelectors?: Prisma.PlatformSelectorUncheckedUpdateManyWithoutUpdatedByNestedInput;
    createdPatterns?: Prisma.PlatformPatternUncheckedUpdateManyWithoutCreatedByNestedInput;
    selectorChangeLogs?: Prisma.SelectorChangeLogUncheckedUpdateManyWithoutChangedByNestedInput;
};
export type UserUncheckedUpdateManyWithoutRolesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    email?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emailVerified?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    image?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    password?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoAccessToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoRefreshToken?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    kakaoTokenExpiry?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    planId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
/**
 * Count Type UserCountOutputType
 */
export type UserCountOutputType = {
    roles: number;
    accounts: number;
    sessions: number;
    accommodations: number;
    checkLogs: number;
    settingsChangeLogs: number;
    auditLogs: number;
    auditLogsAsTarget: number;
    subscriptions: number;
    createdSelectors: number;
    updatedSelectors: number;
    createdPatterns: number;
    selectorChangeLogs: number;
};
export type UserCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    roles?: boolean | UserCountOutputTypeCountRolesArgs;
    accounts?: boolean | UserCountOutputTypeCountAccountsArgs;
    sessions?: boolean | UserCountOutputTypeCountSessionsArgs;
    accommodations?: boolean | UserCountOutputTypeCountAccommodationsArgs;
    checkLogs?: boolean | UserCountOutputTypeCountCheckLogsArgs;
    settingsChangeLogs?: boolean | UserCountOutputTypeCountSettingsChangeLogsArgs;
    auditLogs?: boolean | UserCountOutputTypeCountAuditLogsArgs;
    auditLogsAsTarget?: boolean | UserCountOutputTypeCountAuditLogsAsTargetArgs;
    subscriptions?: boolean | UserCountOutputTypeCountSubscriptionsArgs;
    createdSelectors?: boolean | UserCountOutputTypeCountCreatedSelectorsArgs;
    updatedSelectors?: boolean | UserCountOutputTypeCountUpdatedSelectorsArgs;
    createdPatterns?: boolean | UserCountOutputTypeCountCreatedPatternsArgs;
    selectorChangeLogs?: boolean | UserCountOutputTypeCountSelectorChangeLogsArgs;
};
/**
 * UserCountOutputType without action
 */
export type UserCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: Prisma.UserCountOutputTypeSelect<ExtArgs> | null;
};
/**
 * UserCountOutputType without action
 */
export type UserCountOutputTypeCountRolesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoleWhereInput;
};
/**
 * UserCountOutputType without action
 */
export type UserCountOutputTypeCountAccountsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AccountWhereInput;
};
/**
 * UserCountOutputType without action
 */
export type UserCountOutputTypeCountSessionsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SessionWhereInput;
};
/**
 * UserCountOutputType without action
 */
export type UserCountOutputTypeCountAccommodationsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AccommodationWhereInput;
};
/**
 * UserCountOutputType without action
 */
export type UserCountOutputTypeCountCheckLogsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.CheckLogWhereInput;
};
/**
 * UserCountOutputType without action
 */
export type UserCountOutputTypeCountSettingsChangeLogsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SettingsChangeLogWhereInput;
};
/**
 * UserCountOutputType without action
 */
export type UserCountOutputTypeCountAuditLogsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AuditLogWhereInput;
};
/**
 * UserCountOutputType without action
 */
export type UserCountOutputTypeCountAuditLogsAsTargetArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AuditLogWhereInput;
};
/**
 * UserCountOutputType without action
 */
export type UserCountOutputTypeCountSubscriptionsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SubscriptionWhereInput;
};
/**
 * UserCountOutputType without action
 */
export type UserCountOutputTypeCountCreatedSelectorsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PlatformSelectorWhereInput;
};
/**
 * UserCountOutputType without action
 */
export type UserCountOutputTypeCountUpdatedSelectorsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PlatformSelectorWhereInput;
};
/**
 * UserCountOutputType without action
 */
export type UserCountOutputTypeCountCreatedPatternsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PlatformPatternWhereInput;
};
/**
 * UserCountOutputType without action
 */
export type UserCountOutputTypeCountSelectorChangeLogsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SelectorChangeLogWhereInput;
};
export type UserSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    email?: boolean;
    emailVerified?: boolean;
    image?: boolean;
    password?: boolean;
    kakaoAccessToken?: boolean;
    kakaoRefreshToken?: boolean;
    kakaoTokenExpiry?: boolean;
    planId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    plan?: boolean | Prisma.User$planArgs<ExtArgs>;
    roles?: boolean | Prisma.User$rolesArgs<ExtArgs>;
    accounts?: boolean | Prisma.User$accountsArgs<ExtArgs>;
    sessions?: boolean | Prisma.User$sessionsArgs<ExtArgs>;
    accommodations?: boolean | Prisma.User$accommodationsArgs<ExtArgs>;
    checkLogs?: boolean | Prisma.User$checkLogsArgs<ExtArgs>;
    settingsChangeLogs?: boolean | Prisma.User$settingsChangeLogsArgs<ExtArgs>;
    auditLogs?: boolean | Prisma.User$auditLogsArgs<ExtArgs>;
    auditLogsAsTarget?: boolean | Prisma.User$auditLogsAsTargetArgs<ExtArgs>;
    subscriptions?: boolean | Prisma.User$subscriptionsArgs<ExtArgs>;
    createdSelectors?: boolean | Prisma.User$createdSelectorsArgs<ExtArgs>;
    updatedSelectors?: boolean | Prisma.User$updatedSelectorsArgs<ExtArgs>;
    createdPatterns?: boolean | Prisma.User$createdPatternsArgs<ExtArgs>;
    selectorChangeLogs?: boolean | Prisma.User$selectorChangeLogsArgs<ExtArgs>;
    _count?: boolean | Prisma.UserCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["user"]>;
export type UserSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    email?: boolean;
    emailVerified?: boolean;
    image?: boolean;
    password?: boolean;
    kakaoAccessToken?: boolean;
    kakaoRefreshToken?: boolean;
    kakaoTokenExpiry?: boolean;
    planId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    plan?: boolean | Prisma.User$planArgs<ExtArgs>;
}, ExtArgs["result"]["user"]>;
export type UserSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    email?: boolean;
    emailVerified?: boolean;
    image?: boolean;
    password?: boolean;
    kakaoAccessToken?: boolean;
    kakaoRefreshToken?: boolean;
    kakaoTokenExpiry?: boolean;
    planId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    plan?: boolean | Prisma.User$planArgs<ExtArgs>;
}, ExtArgs["result"]["user"]>;
export type UserSelectScalar = {
    id?: boolean;
    name?: boolean;
    email?: boolean;
    emailVerified?: boolean;
    image?: boolean;
    password?: boolean;
    kakaoAccessToken?: boolean;
    kakaoRefreshToken?: boolean;
    kakaoTokenExpiry?: boolean;
    planId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type UserOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "name" | "email" | "emailVerified" | "image" | "password" | "kakaoAccessToken" | "kakaoRefreshToken" | "kakaoTokenExpiry" | "planId" | "createdAt" | "updatedAt", ExtArgs["result"]["user"]>;
export type UserInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    plan?: boolean | Prisma.User$planArgs<ExtArgs>;
    roles?: boolean | Prisma.User$rolesArgs<ExtArgs>;
    accounts?: boolean | Prisma.User$accountsArgs<ExtArgs>;
    sessions?: boolean | Prisma.User$sessionsArgs<ExtArgs>;
    accommodations?: boolean | Prisma.User$accommodationsArgs<ExtArgs>;
    checkLogs?: boolean | Prisma.User$checkLogsArgs<ExtArgs>;
    settingsChangeLogs?: boolean | Prisma.User$settingsChangeLogsArgs<ExtArgs>;
    auditLogs?: boolean | Prisma.User$auditLogsArgs<ExtArgs>;
    auditLogsAsTarget?: boolean | Prisma.User$auditLogsAsTargetArgs<ExtArgs>;
    subscriptions?: boolean | Prisma.User$subscriptionsArgs<ExtArgs>;
    createdSelectors?: boolean | Prisma.User$createdSelectorsArgs<ExtArgs>;
    updatedSelectors?: boolean | Prisma.User$updatedSelectorsArgs<ExtArgs>;
    createdPatterns?: boolean | Prisma.User$createdPatternsArgs<ExtArgs>;
    selectorChangeLogs?: boolean | Prisma.User$selectorChangeLogsArgs<ExtArgs>;
    _count?: boolean | Prisma.UserCountOutputTypeDefaultArgs<ExtArgs>;
};
export type UserIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    plan?: boolean | Prisma.User$planArgs<ExtArgs>;
};
export type UserIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    plan?: boolean | Prisma.User$planArgs<ExtArgs>;
};
export type $UserPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "User";
    objects: {
        plan: Prisma.$PlanPayload<ExtArgs> | null;
        roles: Prisma.$RolePayload<ExtArgs>[];
        accounts: Prisma.$AccountPayload<ExtArgs>[];
        sessions: Prisma.$SessionPayload<ExtArgs>[];
        accommodations: Prisma.$AccommodationPayload<ExtArgs>[];
        checkLogs: Prisma.$CheckLogPayload<ExtArgs>[];
        settingsChangeLogs: Prisma.$SettingsChangeLogPayload<ExtArgs>[];
        auditLogs: Prisma.$AuditLogPayload<ExtArgs>[];
        auditLogsAsTarget: Prisma.$AuditLogPayload<ExtArgs>[];
        subscriptions: Prisma.$SubscriptionPayload<ExtArgs>[];
        createdSelectors: Prisma.$PlatformSelectorPayload<ExtArgs>[];
        updatedSelectors: Prisma.$PlatformSelectorPayload<ExtArgs>[];
        createdPatterns: Prisma.$PlatformPatternPayload<ExtArgs>[];
        selectorChangeLogs: Prisma.$SelectorChangeLogPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string | null;
        email: string | null;
        emailVerified: Date | null;
        image: string | null;
        password: string | null;
        kakaoAccessToken: string | null;
        kakaoRefreshToken: string | null;
        kakaoTokenExpiry: Date | null;
        planId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["user"]>;
    composites: {};
};
export type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$UserPayload, S>;
export type UserCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: UserCountAggregateInputType | true;
};
export interface UserDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['User'];
        meta: {
            name: 'User';
        };
    };
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: Prisma.SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: Prisma.SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     *
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     *
     */
    findMany<T extends UserFindManyArgs>(args?: Prisma.SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     *
     */
    create<T extends UserCreateArgs>(args: Prisma.SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends UserCreateManyArgs>(args?: Prisma.SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     *
     */
    delete<T extends UserDeleteArgs>(args: Prisma.SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends UserUpdateArgs>(args: Prisma.SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: Prisma.SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends UserUpdateManyArgs>(args: Prisma.SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
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
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: Prisma.SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(args?: Prisma.Subset<T, UserCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], UserCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends UserAggregateArgs>(args: Prisma.Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>;
    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
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
    groupBy<T extends UserGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: UserGroupByArgs['orderBy'];
    } : {
        orderBy?: UserGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the User model
     */
    readonly fields: UserFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for User.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__UserClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    plan<T extends Prisma.User$planArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$planArgs<ExtArgs>>): Prisma.Prisma__PlanClient<runtime.Types.Result.GetResult<Prisma.$PlanPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    roles<T extends Prisma.User$rolesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$rolesArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    accounts<T extends Prisma.User$accountsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$accountsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    sessions<T extends Prisma.User$sessionsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$sessionsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    accommodations<T extends Prisma.User$accommodationsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$accommodationsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AccommodationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    checkLogs<T extends Prisma.User$checkLogsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$checkLogsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CheckLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    settingsChangeLogs<T extends Prisma.User$settingsChangeLogsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$settingsChangeLogsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SettingsChangeLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    auditLogs<T extends Prisma.User$auditLogsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$auditLogsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    auditLogsAsTarget<T extends Prisma.User$auditLogsAsTargetArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$auditLogsAsTargetArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    subscriptions<T extends Prisma.User$subscriptionsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$subscriptionsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    createdSelectors<T extends Prisma.User$createdSelectorsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$createdSelectorsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PlatformSelectorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    updatedSelectors<T extends Prisma.User$updatedSelectorsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$updatedSelectorsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PlatformSelectorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    createdPatterns<T extends Prisma.User$createdPatternsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$createdPatternsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PlatformPatternPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    selectorChangeLogs<T extends Prisma.User$selectorChangeLogsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$selectorChangeLogsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SelectorChangeLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
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
 * Fields of the User model
 */
export interface UserFieldRefs {
    readonly id: Prisma.FieldRef<"User", 'String'>;
    readonly name: Prisma.FieldRef<"User", 'String'>;
    readonly email: Prisma.FieldRef<"User", 'String'>;
    readonly emailVerified: Prisma.FieldRef<"User", 'DateTime'>;
    readonly image: Prisma.FieldRef<"User", 'String'>;
    readonly password: Prisma.FieldRef<"User", 'String'>;
    readonly kakaoAccessToken: Prisma.FieldRef<"User", 'String'>;
    readonly kakaoRefreshToken: Prisma.FieldRef<"User", 'String'>;
    readonly kakaoTokenExpiry: Prisma.FieldRef<"User", 'DateTime'>;
    readonly planId: Prisma.FieldRef<"User", 'String'>;
    readonly createdAt: Prisma.FieldRef<"User", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"User", 'DateTime'>;
}
/**
 * User findUnique
 */
export type UserFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter, which User to fetch.
     */
    where: Prisma.UserWhereUniqueInput;
};
/**
 * User findUniqueOrThrow
 */
export type UserFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter, which User to fetch.
     */
    where: Prisma.UserWhereUniqueInput;
};
/**
 * User findFirst
 */
export type UserFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter, which User to fetch.
     */
    where?: Prisma.UserWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Users.
     */
    cursor?: Prisma.UserWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Users.
     */
    distinct?: Prisma.UserScalarFieldEnum | Prisma.UserScalarFieldEnum[];
};
/**
 * User findFirstOrThrow
 */
export type UserFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter, which User to fetch.
     */
    where?: Prisma.UserWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Users.
     */
    cursor?: Prisma.UserWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Users.
     */
    distinct?: Prisma.UserScalarFieldEnum | Prisma.UserScalarFieldEnum[];
};
/**
 * User findMany
 */
export type UserFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter, which Users to fetch.
     */
    where?: Prisma.UserWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Users.
     */
    cursor?: Prisma.UserWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number;
    distinct?: Prisma.UserScalarFieldEnum | Prisma.UserScalarFieldEnum[];
};
/**
 * User create
 */
export type UserCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * The data needed to create a User.
     */
    data: Prisma.XOR<Prisma.UserCreateInput, Prisma.UserUncheckedCreateInput>;
};
/**
 * User createMany
 */
export type UserCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: Prisma.UserCreateManyInput | Prisma.UserCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * User createManyAndReturn
 */
export type UserCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: Prisma.UserSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the User
     */
    omit?: Prisma.UserOmit<ExtArgs> | null;
    /**
     * The data used to create many Users.
     */
    data: Prisma.UserCreateManyInput | Prisma.UserCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.UserIncludeCreateManyAndReturn<ExtArgs> | null;
};
/**
 * User update
 */
export type UserUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * The data needed to update a User.
     */
    data: Prisma.XOR<Prisma.UserUpdateInput, Prisma.UserUncheckedUpdateInput>;
    /**
     * Choose, which User to update.
     */
    where: Prisma.UserWhereUniqueInput;
};
/**
 * User updateMany
 */
export type UserUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: Prisma.XOR<Prisma.UserUpdateManyMutationInput, Prisma.UserUncheckedUpdateManyInput>;
    /**
     * Filter which Users to update
     */
    where?: Prisma.UserWhereInput;
    /**
     * Limit how many Users to update.
     */
    limit?: number;
};
/**
 * User updateManyAndReturn
 */
export type UserUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: Prisma.UserSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the User
     */
    omit?: Prisma.UserOmit<ExtArgs> | null;
    /**
     * The data used to update Users.
     */
    data: Prisma.XOR<Prisma.UserUpdateManyMutationInput, Prisma.UserUncheckedUpdateManyInput>;
    /**
     * Filter which Users to update
     */
    where?: Prisma.UserWhereInput;
    /**
     * Limit how many Users to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.UserIncludeUpdateManyAndReturn<ExtArgs> | null;
};
/**
 * User upsert
 */
export type UserUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: Prisma.UserWhereUniqueInput;
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: Prisma.XOR<Prisma.UserCreateInput, Prisma.UserUncheckedCreateInput>;
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.UserUpdateInput, Prisma.UserUncheckedUpdateInput>;
};
/**
 * User delete
 */
export type UserDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter which User to delete.
     */
    where: Prisma.UserWhereUniqueInput;
};
/**
 * User deleteMany
 */
export type UserDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: Prisma.UserWhereInput;
    /**
     * Limit how many Users to delete.
     */
    limit?: number;
};
/**
 * User.plan
 */
export type User$planArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Plan
     */
    select?: Prisma.PlanSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Plan
     */
    omit?: Prisma.PlanOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PlanInclude<ExtArgs> | null;
    where?: Prisma.PlanWhereInput;
};
/**
 * User.roles
 */
export type User$rolesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: Prisma.RoleSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Role
     */
    omit?: Prisma.RoleOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.RoleInclude<ExtArgs> | null;
    where?: Prisma.RoleWhereInput;
    orderBy?: Prisma.RoleOrderByWithRelationInput | Prisma.RoleOrderByWithRelationInput[];
    cursor?: Prisma.RoleWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RoleScalarFieldEnum | Prisma.RoleScalarFieldEnum[];
};
/**
 * User.accounts
 */
export type User$accountsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: Prisma.AccountSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Account
     */
    omit?: Prisma.AccountOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AccountInclude<ExtArgs> | null;
    where?: Prisma.AccountWhereInput;
    orderBy?: Prisma.AccountOrderByWithRelationInput | Prisma.AccountOrderByWithRelationInput[];
    cursor?: Prisma.AccountWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AccountScalarFieldEnum | Prisma.AccountScalarFieldEnum[];
};
/**
 * User.sessions
 */
export type User$sessionsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: Prisma.SessionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Session
     */
    omit?: Prisma.SessionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.SessionInclude<ExtArgs> | null;
    where?: Prisma.SessionWhereInput;
    orderBy?: Prisma.SessionOrderByWithRelationInput | Prisma.SessionOrderByWithRelationInput[];
    cursor?: Prisma.SessionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SessionScalarFieldEnum | Prisma.SessionScalarFieldEnum[];
};
/**
 * User.accommodations
 */
export type User$accommodationsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Accommodation
     */
    select?: Prisma.AccommodationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Accommodation
     */
    omit?: Prisma.AccommodationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AccommodationInclude<ExtArgs> | null;
    where?: Prisma.AccommodationWhereInput;
    orderBy?: Prisma.AccommodationOrderByWithRelationInput | Prisma.AccommodationOrderByWithRelationInput[];
    cursor?: Prisma.AccommodationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AccommodationScalarFieldEnum | Prisma.AccommodationScalarFieldEnum[];
};
/**
 * User.checkLogs
 */
export type User$checkLogsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CheckLog
     */
    select?: Prisma.CheckLogSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CheckLog
     */
    omit?: Prisma.CheckLogOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CheckLogInclude<ExtArgs> | null;
    where?: Prisma.CheckLogWhereInput;
    orderBy?: Prisma.CheckLogOrderByWithRelationInput | Prisma.CheckLogOrderByWithRelationInput[];
    cursor?: Prisma.CheckLogWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.CheckLogScalarFieldEnum | Prisma.CheckLogScalarFieldEnum[];
};
/**
 * User.settingsChangeLogs
 */
export type User$settingsChangeLogsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SettingsChangeLog
     */
    select?: Prisma.SettingsChangeLogSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the SettingsChangeLog
     */
    omit?: Prisma.SettingsChangeLogOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.SettingsChangeLogInclude<ExtArgs> | null;
    where?: Prisma.SettingsChangeLogWhereInput;
    orderBy?: Prisma.SettingsChangeLogOrderByWithRelationInput | Prisma.SettingsChangeLogOrderByWithRelationInput[];
    cursor?: Prisma.SettingsChangeLogWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SettingsChangeLogScalarFieldEnum | Prisma.SettingsChangeLogScalarFieldEnum[];
};
/**
 * User.auditLogs
 */
export type User$auditLogsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: Prisma.AuditLogSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: Prisma.AuditLogOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AuditLogInclude<ExtArgs> | null;
    where?: Prisma.AuditLogWhereInput;
    orderBy?: Prisma.AuditLogOrderByWithRelationInput | Prisma.AuditLogOrderByWithRelationInput[];
    cursor?: Prisma.AuditLogWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AuditLogScalarFieldEnum | Prisma.AuditLogScalarFieldEnum[];
};
/**
 * User.auditLogsAsTarget
 */
export type User$auditLogsAsTargetArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: Prisma.AuditLogSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: Prisma.AuditLogOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AuditLogInclude<ExtArgs> | null;
    where?: Prisma.AuditLogWhereInput;
    orderBy?: Prisma.AuditLogOrderByWithRelationInput | Prisma.AuditLogOrderByWithRelationInput[];
    cursor?: Prisma.AuditLogWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AuditLogScalarFieldEnum | Prisma.AuditLogScalarFieldEnum[];
};
/**
 * User.subscriptions
 */
export type User$subscriptionsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: Prisma.SubscriptionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Subscription
     */
    omit?: Prisma.SubscriptionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.SubscriptionInclude<ExtArgs> | null;
    where?: Prisma.SubscriptionWhereInput;
    orderBy?: Prisma.SubscriptionOrderByWithRelationInput | Prisma.SubscriptionOrderByWithRelationInput[];
    cursor?: Prisma.SubscriptionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SubscriptionScalarFieldEnum | Prisma.SubscriptionScalarFieldEnum[];
};
/**
 * User.createdSelectors
 */
export type User$createdSelectorsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    where?: Prisma.PlatformSelectorWhereInput;
    orderBy?: Prisma.PlatformSelectorOrderByWithRelationInput | Prisma.PlatformSelectorOrderByWithRelationInput[];
    cursor?: Prisma.PlatformSelectorWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PlatformSelectorScalarFieldEnum | Prisma.PlatformSelectorScalarFieldEnum[];
};
/**
 * User.updatedSelectors
 */
export type User$updatedSelectorsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    where?: Prisma.PlatformSelectorWhereInput;
    orderBy?: Prisma.PlatformSelectorOrderByWithRelationInput | Prisma.PlatformSelectorOrderByWithRelationInput[];
    cursor?: Prisma.PlatformSelectorWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PlatformSelectorScalarFieldEnum | Prisma.PlatformSelectorScalarFieldEnum[];
};
/**
 * User.createdPatterns
 */
export type User$createdPatternsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlatformPattern
     */
    select?: Prisma.PlatformPatternSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlatformPattern
     */
    omit?: Prisma.PlatformPatternOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PlatformPatternInclude<ExtArgs> | null;
    where?: Prisma.PlatformPatternWhereInput;
    orderBy?: Prisma.PlatformPatternOrderByWithRelationInput | Prisma.PlatformPatternOrderByWithRelationInput[];
    cursor?: Prisma.PlatformPatternWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PlatformPatternScalarFieldEnum | Prisma.PlatformPatternScalarFieldEnum[];
};
/**
 * User.selectorChangeLogs
 */
export type User$selectorChangeLogsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SelectorChangeLog
     */
    select?: Prisma.SelectorChangeLogSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the SelectorChangeLog
     */
    omit?: Prisma.SelectorChangeLogOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.SelectorChangeLogInclude<ExtArgs> | null;
    where?: Prisma.SelectorChangeLogWhereInput;
    orderBy?: Prisma.SelectorChangeLogOrderByWithRelationInput | Prisma.SelectorChangeLogOrderByWithRelationInput[];
    cursor?: Prisma.SelectorChangeLogWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SelectorChangeLogScalarFieldEnum | Prisma.SelectorChangeLogScalarFieldEnum[];
};
/**
 * User without action
 */
export type UserDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
};
export {};
//# sourceMappingURL=User.d.ts.map