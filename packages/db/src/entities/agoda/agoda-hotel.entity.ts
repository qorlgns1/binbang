import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { AGODA_HOTELS_TABLE, getAgodaSharedSchema } from '../../agoda-shared.ts';

// GIN trgm 인덱스는 migration SQL에서 Oracle Text로 별도 생성
@Entity({ name: AGODA_HOTELS_TABLE, schema: getAgodaSharedSchema() })
@Index(['cityId'])
@Index(['countryCode', 'cityId'])
export class AgodaHotel {
  @PrimaryColumn({ type: 'number' })
  hotelId!: number;

  @Column({ type: 'varchar2', length: 500 })
  hotelName!: string;

  @Column({ type: 'varchar2', length: 500, nullable: true })
  hotelTranslatedName!: string | null;

  @Column({ type: 'number' })
  cityId!: number;

  @Column({ type: 'varchar2', length: 200, nullable: true })
  cityName!: string | null;

  @Column({ type: 'varchar2', length: 200, nullable: true })
  countryName!: string | null;

  @Column({ type: 'varchar2', length: 10, nullable: true })
  countryCode!: string | null;

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
}
