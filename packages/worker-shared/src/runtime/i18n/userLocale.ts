/**
 * DB에서 사용자의 선호 locale을 조회한다.
 *
 * User.preferredLocale 필드가 스키마에 추가되면 실제 DB 조회로 전환.
 * 현재는 DEFAULT_LOCALE을 반환한다.
 */
import { DEFAULT_LOCALE, type Locale } from '@workspace/shared/i18n';

/**
 * 사용자의 선호 locale을 반환한다.
 *
 * @param _userId - 사용자 ID (스키마 확장 시 활용)
 */
export async function getUserLocale(_userId: string): Promise<Locale> {
  // TODO: User.preferredLocale 필드 추가 시 활성화
  // const user = await prisma.user.findUnique({
  //   where: { id: _userId },
  //   select: { preferredLocale: true },
  // });
  // return normalizeLocale(user?.preferredLocale);
  return DEFAULT_LOCALE;
}
