/**
 * Travel Destination seed data (Phase 4 SEO pages)
 * 30개 인기 여행지 — 한국어/영어 콘텐츠 포함
 */

export interface SeedDestination {
  slug: string;
  nameKo: string;
  nameEn: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  currency: string;
  descriptionKo: string;
  descriptionEn: string;
  highlightsKo: string[];
  highlightsEn: string[];
}

export const SEED_DESTINATIONS: SeedDestination[] = [
  // ── 일본 ──
  {
    slug: 'tokyo',
    nameKo: '도쿄',
    nameEn: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    latitude: 35.6762,
    longitude: 139.6503,
    currency: 'JPY',
    descriptionKo:
      '도쿄는 전통과 현대가 완벽하게 조화를 이루는 일본의 수도입니다. 아사쿠사의 고즈넉한 센소지 사원부터 최첨단 기술이 집약된 시부야 교차로까지, 다채로운 매력을 지닌 도시입니다. 미슐랭 스타 레스토랑과 활기찬 야시장이 공존하며, 사계절 내내 방문객들에게 잊지 못할 경험을 선사합니다.',
    descriptionEn:
      "Tokyo is Japan's capital where tradition and modernity blend seamlessly. From the historic Senso-ji Temple in Asakusa to the cutting-edge Shibuya Crossing, the city offers diverse attractions. With Michelin-starred restaurants and vibrant night markets coexisting, Tokyo provides unforgettable experiences throughout all seasons.",
    highlightsKo: [
      '츠키지 외곽시장에서 신선한 스시 맛보기',
      '시부야 스크램블 교차로와 하치코 동상',
      '아사쿠사 센소지 사원과 나카미세 거리',
      '도쿄 타워와 스카이트리 전망대',
      '하라주쿠와 오모테산도 쇼핑',
    ],
    highlightsEn: [
      'Fresh sushi at Tsukiji Outer Market',
      'Shibuya Crossing and Hachiko Statue',
      'Senso-ji Temple and Nakamise Street in Asakusa',
      'Tokyo Tower and Skytree observation decks',
      'Shopping in Harajuku and Omotesando',
    ],
  },
  {
    slug: 'osaka',
    nameKo: '오사카',
    nameEn: 'Osaka',
    country: 'Japan',
    countryCode: 'JP',
    latitude: 34.6937,
    longitude: 135.5023,
    currency: 'JPY',
    descriptionKo:
      '오사카는 "일본의 부엌"이라 불리는 미식의 도시입니다. 도톤보리의 네온사인 아래에서 맛보는 타코야키와 오코노미야키는 오사카 여행의 필수 코스입니다. 친절하고 유머러스한 오사카 사람들의 정과 활기찬 거리 분위기가 여행을 더욱 즐겁게 만듭니다.',
    descriptionEn:
      'Osaka, known as "Japan\'s Kitchen," is a culinary paradise. Takoyaki and okonomiyaki enjoyed under Dotonbori\'s neon lights are must-try experiences. The friendly, humorous Osaka locals and vibrant street atmosphere make your visit even more delightful.',
    highlightsKo: [
      '도톤보리 먹자골목 음식 투어',
      '오사카성 역사 탐방',
      '구로몬 시장 해산물 맛집',
      '유니버설 스튜디오 재팬',
      '신사이바시 쇼핑 거리',
    ],
    highlightsEn: [
      'Dotonbori food street tour',
      'Osaka Castle historical exploration',
      'Kuromon Market seafood delicacies',
      'Universal Studios Japan',
      'Shinsaibashi shopping arcade',
    ],
  },
  {
    slug: 'kyoto',
    nameKo: '교토',
    nameEn: 'Kyoto',
    country: 'Japan',
    countryCode: 'JP',
    latitude: 35.0116,
    longitude: 135.7681,
    currency: 'JPY',
    descriptionKo:
      '교토는 천년 고도의 아름다움을 간직한 일본 문화의 심장입니다. 금각사의 황금빛 찬란함과 대나무 숲의 고요함, 게이샤가 걷는 기온 거리의 운치가 시간을 초월한 매력을 선사합니다. 봄의 벚꽃과 가을의 단풍은 교토를 더욱 아름답게 물들입니다.',
    descriptionEn:
      "Kyoto, Japan's ancient capital for over a thousand years, is the heart of Japanese culture. The golden brilliance of Kinkaku-ji, the serenity of bamboo groves, and geisha-filled Gion streets offer timeless charm. Spring cherry blossoms and autumn foliage paint Kyoto in stunning colors.",
    highlightsKo: [
      '금각사(킨카쿠지) 황금 정원',
      '후시미 이나리 신사 천개의 도리이',
      '아라시야마 대나무 숲',
      '기온 게이샤 거리 산책',
      '기요미즈데라 사원 전망대',
    ],
    highlightsEn: [
      'Kinkaku-ji Golden Pavilion',
      'Fushimi Inari Shrine with thousand torii gates',
      'Arashiyama Bamboo Grove',
      'Gion geisha district walk',
      'Kiyomizu-dera Temple viewpoint',
    ],
  },
  // ── 한국 ──
  {
    slug: 'seoul',
    nameKo: '서울',
    nameEn: 'Seoul',
    country: 'South Korea',
    countryCode: 'KR',
    latitude: 37.5665,
    longitude: 126.978,
    currency: 'KRW',
    descriptionKo:
      '서울은 600년 역사의 고궁과 현대적인 마천루가 공존하는 역동적인 대한민국의 수도입니다. K-pop과 한류 문화의 중심지이자, 24시간 잠들지 않는 도시로 명동 쇼핑과 강남 클럽, 북촌 한옥마을까지 다채로운 매력을 자랑합니다.',
    descriptionEn:
      "Seoul is Korea's dynamic capital where 600-year-old palaces coexist with modern skyscrapers. As the heart of K-pop and Korean Wave culture, this 24-hour city offers diverse attractions from Myeongdong shopping and Gangnam clubs to Bukchon Hanok Village.",
    highlightsKo: [
      '경복궁과 광화문 광장',
      '명동 쇼핑과 길거리 음식',
      '북촌 한옥마을 전통 체험',
      '남산 N서울타워 야경',
      '홍대와 강남 나이트라이프',
    ],
    highlightsEn: [
      'Gyeongbokgung Palace and Gwanghwamun Square',
      'Myeongdong shopping and street food',
      'Bukchon Hanok Village traditional experience',
      'N Seoul Tower night view on Namsan',
      'Hongdae and Gangnam nightlife',
    ],
  },
  {
    slug: 'busan',
    nameKo: '부산',
    nameEn: 'Busan',
    country: 'South Korea',
    countryCode: 'KR',
    latitude: 35.1796,
    longitude: 129.0756,
    currency: 'KRW',
    descriptionKo:
      '부산은 푸른 바다와 해운대 백사장이 아름다운 대한민국 제2의 도시입니다. 신선한 해산물로 유명한 자갈치 시장과 감천문화마을의 알록달록한 골목길, 해동용궁사의 바다 위 절경이 여행객들을 매료시킵니다.',
    descriptionEn:
      "Busan is Korea's second-largest city featuring pristine beaches and the famous Haeundae coastline. Jagalchi Fish Market with fresh seafood, colorful alleyways of Gamcheon Culture Village, and Haedong Yonggungsa Temple's seaside views captivate travelers.",
    highlightsKo: [
      '해운대 해수욕장과 달맞이길',
      '자갈치 시장 활어회',
      '감천문화마을 골목 투어',
      '해동용궁사 일출 감상',
      '광안리 해변과 광안대교 야경',
    ],
    highlightsEn: [
      'Haeundae Beach and Dalmaji-gil',
      'Fresh sashimi at Jagalchi Market',
      'Gamcheon Culture Village alley tour',
      'Sunrise at Haedong Yonggungsa Temple',
      'Gwangalli Beach and Diamond Bridge night view',
    ],
  },
  {
    slug: 'jeju',
    nameKo: '제주',
    nameEn: 'Jeju',
    country: 'South Korea',
    countryCode: 'KR',
    latitude: 33.4996,
    longitude: 126.5312,
    currency: 'KRW',
    descriptionKo:
      '제주도는 유네스코 세계자연유산으로 지정된 화산섬입니다. 한라산 등반, 성산일출봉의 장엄한 일출, 푸른 바다가 펼쳐진 협재 해수욕장까지 자연의 아름다움이 가득합니다. 흑돼지와 갈치조림 등 제주만의 특별한 미식도 빼놓을 수 없습니다.',
    descriptionEn:
      'Jeju Island is a UNESCO World Natural Heritage volcanic island. From hiking Hallasan Mountain and witnessing majestic sunrise at Seongsan Ilchulbong to swimming at Hyeopjae Beach, natural beauty abounds. Unique Jeju cuisine like black pork and galchi-jorim (braised cutlassfish) are must-tries.',
    highlightsKo: [
      '한라산 등반과 백록담',
      '성산일출봉 일출 감상',
      '협재 해수욕장 에메랄드빛 바다',
      '만장굴 용암동굴 탐험',
      '제주 흑돼지와 해산물 맛집',
    ],
    highlightsEn: [
      'Hallasan Mountain climb and Baengnokdam crater',
      'Sunrise at Seongsan Ilchulbong',
      'Emerald waters of Hyeopjae Beach',
      'Manjanggul lava tube exploration',
      'Jeju black pork and seafood restaurants',
    ],
  },
  // ── 태국 ──
  {
    slug: 'bangkok',
    nameKo: '방콕',
    nameEn: 'Bangkok',
    country: 'Thailand',
    countryCode: 'TH',
    latitude: 13.7563,
    longitude: 100.5018,
    currency: 'THB',
    descriptionKo:
      '방콕은 화려한 왕궁과 사원, 현대적인 쇼핑몰이 공존하는 태국의 수도입니다. 왓 아룬과 왕궁의 황금빛 불교 건축물부터 카오산 로드의 활기찬 배낭여행자 거리까지 다채롭습니다. 톰얌꿍과 팟타이를 비롯한 길거리 음식은 미식가들의 천국입니다.',
    descriptionEn:
      "Bangkok is Thailand's capital where ornate palaces, temples, and modern malls coexist. From the golden Buddhist architecture of Wat Arun and Grand Palace to the vibrant backpacker scene of Khao San Road, diversity thrives. Street food like tom yum goong and pad thai make it a foodie paradise.",
    highlightsKo: [
      '왓 프라깨우(에메랄드 사원)와 왕궁',
      '왓 아룬(새벽의 사원) 야경',
      '카오산 로드 백패커 거리',
      '차오프라야 강 디너 크루즈',
      '짜뚜짝 주말 시장 쇼핑',
    ],
    highlightsEn: [
      'Wat Phra Kaew (Emerald Temple) and Grand Palace',
      'Wat Arun (Temple of Dawn) night view',
      'Khao San Road backpacker street',
      'Chao Phraya River dinner cruise',
      'Chatuchak Weekend Market shopping',
    ],
  },
  {
    slug: 'phuket',
    nameKo: '푸켓',
    nameEn: 'Phuket',
    country: 'Thailand',
    countryCode: 'TH',
    latitude: 7.8804,
    longitude: 98.3923,
    currency: 'THB',
    descriptionKo:
      '푸켓은 태국 최대의 섬이자 세계적인 해변 휴양지입니다. 에메랄드빛 안다만 해와 백사장이 펼쳐진 파통 비치, 카타 비치에서 즐기는 스노클링과 다이빙은 열대 낙원의 진수를 보여줍니다. 활기찬 방라 로드 나이트라이프도 유명합니다.',
    descriptionEn:
      "Phuket is Thailand's largest island and a world-renowned beach resort. The emerald Andaman Sea and white sand beaches of Patong and Kata offer premier snorkeling and diving experiences showcasing tropical paradise. The vibrant nightlife of Bangla Road is legendary.",
    highlightsKo: [
      '파통 비치 해양 스포츠',
      '피피 섬 당일 투어',
      '빅 부처상과 전망대',
      '푸켓 판타지 쇼',
      '방라 로드 나이트라이프',
    ],
    highlightsEn: [
      'Patong Beach water sports',
      'Phi Phi Islands day trip',
      'Big Buddha and viewpoint',
      'Phuket FantaSea show',
      'Bangla Road nightlife',
    ],
  },
  {
    slug: 'chiang-mai',
    nameKo: '치앙마이',
    nameEn: 'Chiang Mai',
    country: 'Thailand',
    countryCode: 'TH',
    latitude: 18.7883,
    longitude: 98.9853,
    currency: 'THB',
    descriptionKo:
      '치앙마이는 태국 북부의 고즈넉한 문화 도시입니다. 300개가 넘는 사원과 구시가지의 해자가 둘러싼 성벽이 역사를 전합니다. 코끼리 보호센터 방문과 도이 인타논 국립공원 트레킹, 나이트 바자에서의 쇼핑까지 여유로운 여행을 즐길 수 있습니다.',
    descriptionEn:
      'Chiang Mai is a serene cultural city in northern Thailand. Over 300 temples and old city moats and walls tell its rich history. From visiting elephant sanctuaries and trekking Doi Inthanon National Park to shopping at night bazaars, relaxed travel experiences abound.',
    highlightsKo: [
      '왓 프라탓 도이수텝 황금 사원',
      '코끼리 보호센터 체험',
      '도이 인타논 국립공원 트레킹',
      '나이트 바자 쇼핑',
      '란나 전통 마사지',
    ],
    highlightsEn: [
      'Wat Phra That Doi Suthep golden temple',
      'Elephant sanctuary experience',
      'Doi Inthanon National Park trekking',
      'Night Bazaar shopping',
      'Traditional Lanna massage',
    ],
  },
  // ── 프랑스 ──
  {
    slug: 'paris',
    nameKo: '파리',
    nameEn: 'Paris',
    country: 'France',
    countryCode: 'FR',
    latitude: 48.8566,
    longitude: 2.3522,
    currency: 'EUR',
    descriptionKo:
      '파리는 세계에서 가장 로맨틱한 도시로 불리는 프랑스의 수도입니다. 에펠탑의 야경과 샹젤리제 거리의 우아함, 루브르 박물관의 예술 작품들이 도시 전체를 하나의 박물관처럼 만듭니다. 크루아상과 와인, 에스카르고를 즐기며 센 강변을 거니는 것만으로도 완벽한 파리 여행이 됩니다.',
    descriptionEn:
      "Paris, France's capital, is called the world's most romantic city. The Eiffel Tower's night view, elegance of Champs-Élysées, and Louvre's artworks turn the entire city into a museum. Simply strolling along the Seine with croissants, wine, and escargot makes a perfect Parisian experience.",
    highlightsKo: [
      '에펠탑 정상 전망대',
      '루브르 박물관 모나리자',
      '샹젤리제 거리와 개선문',
      '몽마르트 언덕과 사크레쾨르',
      '센 강 유람선 투어',
    ],
    highlightsEn: [
      'Eiffel Tower summit observation deck',
      'Mona Lisa at Louvre Museum',
      'Champs-Élysées and Arc de Triomphe',
      'Montmartre and Sacré-Cœur',
      'Seine River cruise',
    ],
  },
  {
    slug: 'nice',
    nameKo: '니스',
    nameEn: 'Nice',
    country: 'France',
    countryCode: 'FR',
    latitude: 43.7102,
    longitude: 7.262,
    currency: 'EUR',
    descriptionKo:
      '니스는 프랑스 리비에라의 진주로 불리는 지중해 휴양 도시입니다. 코발트블루 바다와 프롬나드 데 장글레의 야자수 가로수길, 구시가지의 파스텔톤 건물들이 완벽한 조화를 이룹니다. 따뜻한 햇살 아래 즐기는 니스 사라드와 소카는 여행의 즐거움을 배가합니다.',
    descriptionEn:
      'Nice, known as the Pearl of the French Riviera, is a Mediterranean resort city. Cobalt blue seas, palm-lined Promenade des Anglais, and pastel buildings in the old town create perfect harmony. Enjoying Niçoise salad and socca under warm sunshine doubles travel pleasure.',
    highlightsKo: [
      '프롬나드 데 장글레 해변 산책',
      '구시가지 쿠르 살레야 시장',
      '샤갈 미술관',
      '성 언덕(Colline du Château) 전망',
      '지중해 해산물 요리',
    ],
    highlightsEn: [
      'Promenade des Anglais beach walk',
      'Cours Saleya market in old town',
      'Chagall Museum',
      'Castle Hill (Colline du Château) viewpoint',
      'Mediterranean seafood cuisine',
    ],
  },
  // ── 이탈리아 ──
  {
    slug: 'rome',
    nameKo: '로마',
    nameEn: 'Rome',
    country: 'Italy',
    countryCode: 'IT',
    latitude: 41.9028,
    longitude: 12.4964,
    currency: 'EUR',
    descriptionKo:
      '로마는 "영원한 도시"로 불리는 이탈리아의 수도이자 고대 로마 제국의 심장입니다. 콜로세움과 포로 로마노의 웅장한 유적, 바티칸의 성 베드로 대성당과 시스티나 성당의 천장화는 인류 문명의 정수를 보여줍니다. 트레비 분수에 동전을 던지며 다시 로마를 찾을 것을 약속하세요.',
    descriptionEn:
      "Rome, the \"Eternal City,\" is Italy's capital and heart of the ancient Roman Empire. Magnificent ruins of the Colosseum and Roman Forum, Vatican's St. Peter's Basilica, and Sistine Chapel ceiling frescoes showcase human civilization's pinnacle. Toss a coin in Trevi Fountain to promise your return to Rome.",
    highlightsKo: [
      '콜로세움과 고대 로마 유적',
      '바티칸 시스티나 성당 천장화',
      '트레비 분수 동전 던지기',
      '스페인 계단과 젤라또',
      '판테온과 나보나 광장',
    ],
    highlightsEn: [
      'Colosseum and ancient Roman ruins',
      'Vatican Sistine Chapel ceiling',
      'Toss coin at Trevi Fountain',
      'Spanish Steps and gelato',
      'Pantheon and Piazza Navona',
    ],
  },
  {
    slug: 'venice',
    nameKo: '베네치아',
    nameEn: 'Venice',
    country: 'Italy',
    countryCode: 'IT',
    latitude: 45.4408,
    longitude: 12.3155,
    currency: 'EUR',
    descriptionKo:
      '베네치아는 물 위에 세워진 환상적인 도시입니다. 곤돌라를 타고 좁은 운하를 누비며 산 마르코 광장과 리알토 다리를 구경하는 것은 마치 중세 시대로 시간여행을 하는 듯합니다. 베네치안 마스크와 무라노 유리 공예품은 특별한 기념품이 됩니다.',
    descriptionEn:
      "Venice is a fantastical city built on water. Navigating narrow canals in a gondola past St. Mark's Square and Rialto Bridge feels like time-traveling to medieval times. Venetian masks and Murano glass crafts make unique souvenirs.",
    highlightsKo: [
      '곤돌라 타고 대운하 투어',
      '산 마르코 대성당과 광장',
      '리알토 다리와 시장',
      '무라노 섬 유리 공예 구경',
      '부라노 섬 알록달록한 집들',
    ],
    highlightsEn: [
      'Gondola ride on Grand Canal',
      "St. Mark's Basilica and Square",
      'Rialto Bridge and Market',
      'Murano Island glass art',
      'Burano Island colorful houses',
    ],
  },
  {
    slug: 'florence',
    nameKo: '피렌체',
    nameEn: 'Florence',
    country: 'Italy',
    countryCode: 'IT',
    latitude: 43.7696,
    longitude: 11.2558,
    currency: 'EUR',
    descriptionKo:
      '피렌체는 르네상스의 발상지로 예술과 건축의 보고입니다. 미켈란젤로의 다비드상과 우피치 미술관의 보티첼리 작품들이 도시 곳곳에서 예술혼을 불러일으킵니다. 두오모 성당의 쿠폴라에 올라 토스카나의 붉은 지붕들을 내려다보는 순간은 평생 잊지 못할 추억이 됩니다.',
    descriptionEn:
      "Florence is the birthplace of the Renaissance and a treasure trove of art and architecture. Michelangelo's David and Botticelli's works at Uffizi Gallery inspire artistic souls throughout the city. Climbing Duomo's cupola to view Tuscany's red rooftops creates unforgettable memories.",
    highlightsKo: [
      '미켈란젤로 다비드상 감상',
      '우피치 미술관 르네상스 걸작',
      '두오모 성당 쿠폴라 전망',
      '베키오 다리와 아르노 강',
      '토스카나 와인과 비스테카',
    ],
    highlightsEn: [
      "Michelangelo's David statue",
      'Uffizi Gallery Renaissance masterpieces',
      'Duomo Cathedral cupola view',
      'Ponte Vecchio and Arno River',
      'Tuscan wine and bistecca',
    ],
  },
  // ── 영국 ──
  {
    slug: 'london',
    nameKo: '런던',
    nameEn: 'London',
    country: 'United Kingdom',
    countryCode: 'GB',
    latitude: 51.5074,
    longitude: -0.1278,
    currency: 'GBP',
    descriptionKo:
      '런던은 영국의 수도이자 세계 금융과 문화의 중심지입니다. 버킹엄 궁전의 근위병 교대식부터 대영박물관의 로제타석, 빅벤과 런던아이까지 볼거리가 가득합니다. 애프터눈 티와 피시앤칩스를 즐기며 템스 강변을 거니는 것은 런던 여행의 백미입니다.',
    descriptionEn:
      "London is the UK's capital and a global financial and cultural hub. From Buckingham Palace's Changing of the Guard to the British Museum's Rosetta Stone, Big Ben, and London Eye, attractions abound. Enjoying afternoon tea and fish & chips while strolling the Thames embankment is quintessentially London.",
    highlightsKo: [
      '버킹엄 궁전 근위병 교대식',
      '대영박물관 무료 입장',
      '빅벤과 웨스트민스터 사원',
      '런던아이 템스 강 전망',
      '코벤트 가든과 애프터눈 티',
    ],
    highlightsEn: [
      'Buckingham Palace Changing of Guard',
      'Free admission British Museum',
      'Big Ben and Westminster Abbey',
      'London Eye Thames River view',
      'Covent Garden and afternoon tea',
    ],
  },
  // ── 스페인 ──
  {
    slug: 'barcelona',
    nameKo: '바르셀로나',
    nameEn: 'Barcelona',
    country: 'Spain',
    countryCode: 'ES',
    latitude: 41.3851,
    longitude: 2.1734,
    currency: 'EUR',
    descriptionKo:
      '바르셀로나는 가우디의 건축물이 빛나는 카탈루냐의 수도입니다. 사그라다 파밀리아 성당의 경이로운 건축미와 구엘 공원의 모자이크 예술, 람블라스 거리의 활기찬 분위기가 도시를 특별하게 만듭니다. 지중해의 신선한 해산물 파에야는 미식 여행의 하이라이트입니다.',
    descriptionEn:
      "Barcelona is the Catalan capital where Gaudí's architecture shines. The awe-inspiring Sagrada Família, Park Güell's mosaic art, and vibrant La Ramblas atmosphere make the city special. Fresh Mediterranean seafood paella is a culinary highlight.",
    highlightsKo: [
      '사그라다 파밀리아 성당',
      '구엘 공원 모자이크 테라스',
      '람블라스 거리와 보케리아 시장',
      '고딕 지구 역사 탐방',
      '바르셀로네타 해변과 파에야',
    ],
    highlightsEn: [
      'Sagrada Família Basilica',
      'Park Güell mosaic terrace',
      'La Ramblas and Boqueria Market',
      'Gothic Quarter historical exploration',
      'Barceloneta Beach and paella',
    ],
  },
  {
    slug: 'madrid',
    nameKo: '마드리드',
    nameEn: 'Madrid',
    country: 'Spain',
    countryCode: 'ES',
    latitude: 40.4168,
    longitude: -3.7038,
    currency: 'EUR',
    descriptionKo:
      '마드리드는 스페인의 활기찬 수도로 낮과 밤이 다른 매력을 지닙니다. 프라도 미술관의 벨라스케스와 고야 작품, 레티로 공원의 여유로운 오후, 그랑 비아의 쇼핑과 타파스 바 호핑까지 다채롭습니다. 플라멩코 공연은 스페인 문화의 열정을 느낄 수 있는 특별한 경험입니다.',
    descriptionEn:
      "Madrid is Spain's vibrant capital with different charms day and night. Prado Museum's Velázquez and Goya works, leisurely afternoons in Retiro Park, Gran Vía shopping, and tapas bar hopping offer diversity. Flamenco shows provide a passionate Spanish cultural experience.",
    highlightsKo: [
      '프라도 미술관 명화 감상',
      '레티로 공원 보트 타기',
      '왕궁과 알무데나 대성당',
      '그랑 비아 쇼핑 거리',
      '타파스 바 호핑과 플라멩코',
    ],
    highlightsEn: [
      'Prado Museum masterpieces',
      'Retiro Park boat ride',
      'Royal Palace and Almudena Cathedral',
      'Gran Vía shopping street',
      'Tapas bar hopping and flamenco',
    ],
  },
  // ── 미국 ──
  {
    slug: 'new-york',
    nameKo: '뉴욕',
    nameEn: 'New York',
    country: 'United States',
    countryCode: 'US',
    latitude: 40.7128,
    longitude: -74.006,
    currency: 'USD',
    descriptionKo:
      '뉴욕은 "잠들지 않는 도시"로 불리는 미국 최대의 도시입니다. 자유의 여신상과 타임스퀘어의 네온사인, 센트럴 파크의 푸른 숲과 브로드웨이 뮤지컬까지 끊임없는 활력이 넘칩니다. 세계 각국의 음식을 맛볼 수 있는 다문화 도시이자, 현대 예술과 패션의 메카입니다.',
    descriptionEn:
      "New York is America's largest city, \"The City That Never Sleeps.\" From the Statue of Liberty and Times Square's neon lights to Central Park's greenery and Broadway musicals, endless energy flows. This multicultural metropolis offers global cuisine and serves as a mecca for contemporary art and fashion.",
    highlightsKo: [
      '자유의 여신상 페리 투어',
      '타임스퀘어와 브로드웨이 뮤지컬',
      '센트럴 파크 산책',
      '메트로폴리탄 미술관',
      '브루클린 브릿지 야경',
    ],
    highlightsEn: [
      'Statue of Liberty ferry tour',
      'Times Square and Broadway musicals',
      'Central Park stroll',
      'Metropolitan Museum of Art',
      'Brooklyn Bridge night view',
    ],
  },
  {
    slug: 'los-angeles',
    nameKo: '로스앤젤레스',
    nameEn: 'Los Angeles',
    country: 'United States',
    countryCode: 'US',
    latitude: 34.0522,
    longitude: -118.2437,
    currency: 'USD',
    descriptionKo:
      'LA는 할리우드와 비버리힐스로 유명한 미국 서부 최대 도시입니다. 산타모니카 해변의 석양과 유니버설 스튜디오, 할리우드 명예의 거리를 거닐며 영화 산업의 심장을 느낄 수 있습니다. 타코와 인앤아웃 버거 등 캘리포니아 스타일 음식도 여행의 즐거움을 더합니다.',
    descriptionEn:
      'LA is the largest city in the western US, famous for Hollywood and Beverly Hills. Feel the heart of the film industry while watching Santa Monica Beach sunsets, visiting Universal Studios, and walking the Hollywood Walk of Fame. California-style food like tacos and In-N-Out Burger adds to travel enjoyment.',
    highlightsKo: [
      '할리우드 명예의 거리',
      '유니버설 스튜디오',
      '산타모니카 피어와 해변',
      '그리피스 천문대 야경',
      '베벌리힐스 로데오 드라이브',
    ],
    highlightsEn: [
      'Hollywood Walk of Fame',
      'Universal Studios',
      'Santa Monica Pier and Beach',
      'Griffith Observatory night view',
      'Beverly Hills Rodeo Drive',
    ],
  },
  {
    slug: 'san-francisco',
    nameKo: '샌프란시스코',
    nameEn: 'San Francisco',
    country: 'United States',
    countryCode: 'US',
    latitude: 37.7749,
    longitude: -122.4194,
    currency: 'USD',
    descriptionKo:
      '샌프란시스코는 금문교가 상징인 아름다운 항구 도시입니다. 케이블카를 타고 언덕을 오르내리며 피셔맨스 워프의 신선한 해산물을 맛보고, 알카트라즈 감옥 투어를 즐길 수 있습니다. 실리콘밸리와 가까워 IT 혁신의 현장도 느낄 수 있는 독특한 도시입니다.',
    descriptionEn:
      "San Francisco is a beautiful port city symbolized by the Golden Gate Bridge. Ride cable cars up and down hills, savor fresh seafood at Fisherman's Wharf, and tour Alcatraz prison. Its proximity to Silicon Valley offers a unique glimpse into IT innovation.",
    highlightsKo: [
      '금문교 전망대',
      '케이블카 투어',
      '피셔맨스 워프 크램 차우더',
      '알카트라즈 섬 감옥 투어',
      '롬바드 스트리트 구불길',
    ],
    highlightsEn: [
      'Golden Gate Bridge viewpoint',
      'Cable car tour',
      "Fisherman's Wharf clam chowder",
      'Alcatraz Island prison tour',
      'Lombard Street crooked street',
    ],
  },
  // ── 싱가포르 ──
  {
    slug: 'singapore',
    nameKo: '싱가포르',
    nameEn: 'Singapore',
    country: 'Singapore',
    countryCode: 'SG',
    latitude: 1.3521,
    longitude: 103.8198,
    currency: 'SGD',
    descriptionKo:
      '싱가포르는 아시아의 정원 도시 국가입니다. 마리나 베이 샌즈의 인피니티 풀과 가든스 바이 더 베이의 슈퍼트리, 다양한 에스닉 푸드가 공존하는 호커 센터까지 완벽한 조화를 이룹니다. 청결하고 안전한 도시에서 동서양 문화가 융합된 특별한 경험을 할 수 있습니다.',
    descriptionEn:
      "Singapore is Asia's garden city-state. Marina Bay Sands' infinity pool, Gardens by the Bay's Supertrees, and hawker centers offering diverse ethnic foods create perfect harmony. This clean, safe city offers a unique blend of Eastern and Western cultures.",
    highlightsKo: [
      '마리나 베이 샌즈 인피니티 풀',
      '가든스 바이 더 베이 슈퍼트리',
      '센토사 섬 리조트',
      '차이나타운과 리틀 인디아',
      '호커 센터 다국적 음식',
    ],
    highlightsEn: [
      'Marina Bay Sands infinity pool',
      'Gardens by the Bay Supertrees',
      'Sentosa Island resort',
      'Chinatown and Little India',
      'Hawker center international cuisine',
    ],
  },
  // ── 호주 ──
  {
    slug: 'sydney',
    nameKo: '시드니',
    nameEn: 'Sydney',
    country: 'Australia',
    countryCode: 'AU',
    latitude: -33.8688,
    longitude: 151.2093,
    currency: 'AUD',
    descriptionKo:
      '시드니는 오페라 하우스가 상징인 호주 최대 도시입니다. 하버 브리지를 배경으로 한 오페라 하우스의 야경과 본다이 비치의 서핑, 달링 하버의 활기찬 분위기가 매력적입니다. 신선한 시푸드와 와인을 즐기며 남반구의 아름다운 자연을 만끽할 수 있습니다.',
    descriptionEn:
      "Sydney is Australia's largest city, symbolized by the Opera House. The Opera House night view with Harbour Bridge backdrop, Bondi Beach surfing, and vibrant Darling Harbour atmosphere captivate visitors. Enjoy fresh seafood and wine while experiencing the Southern Hemisphere's natural beauty.",
    highlightsKo: [
      '시드니 오페라 하우스 투어',
      '하버 브리지 클라이밍',
      '본다이 비치 서핑',
      '달링 하버 야경',
      '블루 마운틴 국립공원',
    ],
    highlightsEn: [
      'Sydney Opera House tour',
      'Harbour Bridge climb',
      'Bondi Beach surfing',
      'Darling Harbour night view',
      'Blue Mountains National Park',
    ],
  },
  {
    slug: 'melbourne',
    nameKo: '멜버른',
    nameEn: 'Melbourne',
    country: 'Australia',
    countryCode: 'AU',
    latitude: -37.8136,
    longitude: 144.9631,
    currency: 'AUD',
    descriptionKo:
      '멜버른은 유럽 감성이 물씬 풍기는 호주의 문화 수도입니다. 빅토리아 양식 건물과 골목 곳곳의 스트리트 아트, 트램이 다니는 거리가 독특한 분위기를 만듭니다. 세계 최고 수준의 커피 문화와 다문화 음식, 연중 이어지는 예술 축제가 여행객들을 반깁니다.',
    descriptionEn:
      "Melbourne is Australia's cultural capital with strong European vibes. Victorian architecture, street art in laneways, and tram-filled streets create a unique atmosphere. World-class coffee culture, multicultural cuisine, and year-round art festivals welcome travelers.",
    highlightsKo: [
      '연방 광장과 플린더스 역',
      '퀸 빅토리아 마켓',
      '골목길 스트리트 아트 투어',
      '그레이트 오션 로드',
      '멜버른 카페 문화 체험',
    ],
    highlightsEn: [
      'Federation Square and Flinders Station',
      'Queen Victoria Market',
      'Laneway street art tour',
      'Great Ocean Road',
      'Melbourne cafe culture experience',
    ],
  },
  // ── 뉴질랜드 ──
  {
    slug: 'auckland',
    nameKo: '오클랜드',
    nameEn: 'Auckland',
    country: 'New Zealand',
    countryCode: 'NZ',
    latitude: -36.8485,
    longitude: 174.7633,
    currency: 'NZD',
    descriptionKo:
      '오클랜드는 "돛의 도시"로 불리는 뉴질랜드 최대 도시입니다. 와이헤케 섬의 와이너리 투어와 스카이 타워 전망, 와이토모 반딧불이 동굴까지 자연과 도시가 조화를 이룹니다. 마오리 문화 체험과 신선한 양고기, 해산물 요리도 여행의 즐거움을 더합니다.',
    descriptionEn:
      'Auckland is New Zealand\'s largest city, called the "City of Sails." Waiheke Island winery tours, Sky Tower views, and Waitomo Glowworm Caves blend nature and city. Maori cultural experiences and fresh lamb and seafood cuisine enhance travel enjoyment.',
    highlightsKo: [
      '스카이 타워 전망대',
      '와이헤케 섬 와이너리',
      '와이토모 반딧불이 동굴',
      '마오리 문화 공연',
      '미션 베이 해변',
    ],
    highlightsEn: [
      'Sky Tower observation deck',
      'Waiheke Island wineries',
      'Waitomo Glowworm Caves',
      'Maori cultural performance',
      'Mission Bay beach',
    ],
  },
  // ── 베트남 ──
  {
    slug: 'hanoi',
    nameKo: '하노이',
    nameEn: 'Hanoi',
    country: 'Vietnam',
    countryCode: 'VN',
    latitude: 21.0285,
    longitude: 105.8542,
    currency: 'VND',
    descriptionKo:
      '하노이는 천년 역사를 간직한 베트남의 수도입니다. 호안끼엠 호수와 구시가지의 프랑스 식민지 건축물, 분주한 오토바이 행렬이 독특한 풍경을 만듭니다. 쌀국수 포와 반미, 에그 커피 등 베트남 특유의 음식 문화를 만끽할 수 있는 미식의 도시입니다.',
    descriptionEn:
      "Hanoi is Vietnam's capital with a thousand-year history. Hoan Kiem Lake, French colonial architecture in the Old Quarter, and bustling motorcycle traffic create unique scenery. This culinary city lets you savor Vietnamese food culture through pho, banh mi, and egg coffee.",
    highlightsKo: [
      '호안끼엠 호수와 옥산 사원',
      '구시가지 36거리',
      '호치민 묘소',
      '하롱베이 크루즈',
      '분짜와 에그 커피',
    ],
    highlightsEn: [
      'Hoan Kiem Lake and Ngoc Son Temple',
      'Old Quarter 36 Streets',
      'Ho Chi Minh Mausoleum',
      'Halong Bay cruise',
      'Bun cha and egg coffee',
    ],
  },
  {
    slug: 'ho-chi-minh',
    nameKo: '호치민',
    nameEn: 'Ho Chi Minh City',
    country: 'Vietnam',
    countryCode: 'VN',
    latitude: 10.8231,
    longitude: 106.6297,
    currency: 'VND',
    descriptionKo:
      '호치민은 구 사이공으로 불리는 베트남 최대의 상업 도시입니다. 프랑스 식민지 시대 건축물과 전쟁 박물관, 벤탄 시장의 활기가 도시의 역사를 말해줍니다. 메콩 델타 투어와 쌀국수, 반세오 등 남부 베트남 요리를 즐길 수 있는 활기찬 도시입니다.',
    descriptionEn:
      "Ho Chi Minh, formerly Saigon, is Vietnam's largest commercial city. French colonial architecture, War Remnants Museum, and bustling Ben Thanh Market tell the city's history. This vibrant city offers Mekong Delta tours and southern Vietnamese cuisine like pho and banh xeo.",
    highlightsKo: [
      '노트르담 대성당과 중앙 우체국',
      '전쟁 박물관',
      '벤탄 시장 쇼핑',
      '메콩 델타 보트 투어',
      '반미와 분보 훼',
    ],
    highlightsEn: [
      'Notre Dame Cathedral and Central Post Office',
      'War Remnants Museum',
      'Ben Thanh Market shopping',
      'Mekong Delta boat tour',
      'Banh mi and bun bo Hue',
    ],
  },
  // ── 말레이시아 ──
  {
    slug: 'kuala-lumpur',
    nameKo: '쿠알라룸푸르',
    nameEn: 'Kuala Lumpur',
    country: 'Malaysia',
    countryCode: 'MY',
    latitude: 3.139,
    longitude: 101.6869,
    currency: 'MYR',
    descriptionKo:
      '쿠알라룸푸르는 페트로나스 트윈 타워가 상징인 말레이시아의 수도입니다. 이슬람 사원과 힌두 사원, 중국 사원이 공존하며 다문화 사회를 보여줍니다. 바투 동굴의 계단과 부킷 빈탕 쇼핑, 나시 레막과 로티 차나이 등 다양한 음식도 매력적입니다.',
    descriptionEn:
      "Kuala Lumpur is Malaysia's capital, symbolized by Petronas Twin Towers. Islamic mosques, Hindu temples, and Chinese temples coexist, showcasing a multicultural society. Batu Caves stairs, Bukit Bintang shopping, and diverse foods like nasi lemak and roti canai captivate visitors.",
    highlightsKo: [
      '페트로나스 트윈 타워 야경',
      '바투 동굴 힌두 사원',
      '부킷 빈탕 쇼핑 거리',
      '메르데카 광장',
      '말레이시아 다국적 음식',
    ],
    highlightsEn: [
      'Petronas Twin Towers night view',
      'Batu Caves Hindu temple',
      'Bukit Bintang shopping district',
      'Merdeka Square',
      'Malaysian multicultural cuisine',
    ],
  },
  // ── 인도네시아 ──
  {
    slug: 'bali',
    nameKo: '발리',
    nameEn: 'Bali',
    country: 'Indonesia',
    countryCode: 'ID',
    latitude: -8.3405,
    longitude: 115.092,
    currency: 'IDR',
    descriptionKo:
      '발리는 "신들의 섬"으로 불리는 인도네시아의 열대 낙원입니다. 우붓의 계단식 논과 원숭이 숲, 탄중 베노아의 해양 스포츠, 울루와뚜 사원의 일몰이 완벽한 휴양을 선사합니다. 발리 전통 마사지와 나시 고렝으로 여유로운 시간을 즐길 수 있습니다.',
    descriptionEn:
      'Bali is Indonesia\'s tropical paradise called the "Island of Gods." Ubud\'s rice terraces and Monkey Forest, Tanjung Benoa water sports, and Uluwatu Temple sunsets offer perfect relaxation. Enjoy leisurely time with traditional Balinese massage and nasi goreng.',
    highlightsKo: [
      '우붓 계단식 논과 원숭이 숲',
      '울루와뚜 사원 일몰',
      '탄중 베노아 해양 스포츠',
      '스미냑 비치 클럽',
      '발리 전통 마사지',
    ],
    highlightsEn: [
      'Ubud rice terraces and Monkey Forest',
      'Uluwatu Temple sunset',
      'Tanjung Benoa water sports',
      'Seminyak beach clubs',
      'Traditional Balinese massage',
    ],
  },
  // ── UAE ──
  {
    slug: 'dubai',
    nameKo: '두바이',
    nameEn: 'Dubai',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    latitude: 25.2048,
    longitude: 55.2708,
    currency: 'AED',
    descriptionKo:
      '두바이는 사막 위에 세워진 미래 도시입니다. 세계 최고층 부르즈 칼리파와 인공섬 팜 주메이라, 럭셔리 쇼핑몰이 현대 문명의 극치를 보여줍니다. 사막 사파리와 골드 수크 시장, 전통 아랍 음식을 통해 중동 문화도 경험할 수 있습니다.',
    descriptionEn:
      "Dubai is a futuristic city built on desert sands. The world's tallest Burj Khalifa, artificial Palm Jumeirah island, and luxury malls showcase modern civilization's pinnacle. Desert safaris, Gold Souk market, and traditional Arabic cuisine offer Middle Eastern cultural experiences.",
    highlightsKo: [
      '부르즈 칼리파 전망대',
      '두바이 몰과 분수 쇼',
      '사막 사파리와 낙타 타기',
      '골드 수크 시장',
      '팜 주메이라 리조트',
    ],
    highlightsEn: [
      'Burj Khalifa observation deck',
      'Dubai Mall and fountain show',
      'Desert safari and camel riding',
      'Gold Souk market',
      'Palm Jumeirah resorts',
    ],
  },
  // ── 터키 ──
  {
    slug: 'istanbul',
    nameKo: '이스탄불',
    nameEn: 'Istanbul',
    country: 'Turkey',
    countryCode: 'TR',
    latitude: 41.0082,
    longitude: 28.9784,
    currency: 'TRY',
    descriptionKo:
      '이스탄불은 유럽과 아시아를 잇는 문명의 교차로입니다. 블루 모스크와 아야 소피아의 장엄한 이슬람 건축, 그랜드 바자르의 활기찬 분위기가 동서양 문화의 융합을 보여줍니다. 보스포루스 크루즈와 터키식 커피, 케밥으로 이국적인 여행을 만끽할 수 있습니다.',
    descriptionEn:
      "Istanbul is a crossroads of civilization linking Europe and Asia. Blue Mosque and Hagia Sophia's majestic Islamic architecture, Grand Bazaar's vibrant atmosphere showcase East-West cultural fusion. Bosphorus cruises, Turkish coffee, and kebabs offer exotic travel experiences.",
    highlightsKo: [
      '블루 모스크와 아야 소피아',
      '그랜드 바자르 쇼핑',
      '보스포루스 크루즈',
      '톱카프 궁전',
      '터키식 목욕탕 하맘',
    ],
    highlightsEn: [
      'Blue Mosque and Hagia Sophia',
      'Grand Bazaar shopping',
      'Bosphorus cruise',
      'Topkapi Palace',
      'Turkish bath hammam',
    ],
  },
];
