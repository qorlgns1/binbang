import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

import { AGODA_HOTELS_SEARCH_TABLE, getAgodaSharedSchema } from '../../agoda-shared.ts';
import { booleanTransformer } from '../base/transformers.ts';

@Entity({ name: AGODA_HOTELS_SEARCH_TABLE, schema: getAgodaSharedSchema() })
@Index(['cityId'])
@Index(['countryCode', 'cityId'])
export class AgodaHotelSearch {
  @PrimaryColumn({ type: 'number' })
  hotelId!: number;

  @Column({ type: 'number' })
  cityId!: number;

  @Column({ type: 'varchar2', length: 10, nullable: true })
  countryCode!: string | null;

  @Column({ type: 'varchar2', length: 500, nullable: true })
  hotelNameKo!: string | null;

  @Column({ type: 'varchar2', length: 500, nullable: true })
  hotelNameEn!: string | null;

  @Column({ type: 'varchar2', length: 200, nullable: true })
  cityNameKo!: string | null;

  @Column({ type: 'varchar2', length: 200, nullable: true })
  cityNameEn!: string | null;

  @Column({ type: 'varchar2', length: 200, nullable: true })
  countryNameKo!: string | null;

  @Column({ type: 'varchar2', length: 200, nullable: true })
  countryNameEn!: string | null;

  @Column({ type: 'double precision', nullable: true })
  starRating!: number | null;

  @Column({ type: 'double precision', nullable: true })
  ratingAverage!: number | null;

  @Column({ type: 'number', nullable: true })
  reviewCount!: number | null;

  @Column({ type: 'double precision', nullable: true })
  latitude!: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude!: number | null;

  @Column({ type: 'clob', nullable: true })
  photoUrl!: string | null;

  @Column({ type: 'clob', nullable: true })
  url!: string | null;

  @Column({ type: 'clob' })
  searchTextKo!: string;

  @Column({ type: 'clob' })
  searchTextEn!: string;

  @Column({ type: 'smallint', default: () => '0', transformer: booleanTransformer })
  koSourcePresent!: boolean;

  @Column({ type: 'smallint', default: () => '0', transformer: booleanTransformer })
  enSourcePresent!: boolean;

  @Column({ type: 'smallint', default: () => '0', transformer: booleanTransformer })
  llmAliasFilled!: boolean;

  @Column({ type: 'timestamp with time zone', default: () => 'SYSTIMESTAMP' })
  mergedAt!: Date;

  @Column({ type: 'timestamp with time zone', default: () => 'SYSTIMESTAMP' })
  updatedAt!: Date;
}
