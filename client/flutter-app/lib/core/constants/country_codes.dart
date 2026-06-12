// Country dial-code data, ported from
// `kridaz/client/user/src/utils/countryCodes.js`. Used by the scoring start
// modal's custom-player phone field; reusable by any other phone-input
// surface (auth, profile, invite flows).

class CountryCode {
  final String name;
  final String iso; // ISO 3166-1 alpha-2
  final String dial; // E.164 calling code without the leading '+'

  const CountryCode(this.name, this.iso, this.dial);

  /// "🇮🇳 +91" style label for compact UI chips. The flag is rendered via
  /// regional-indicator unicode pairs so we don't ship a font/image asset.
  String get flag => iso.codeUnits
      .map((u) => String.fromCharCode(0x1F1E6 + (u - 0x41)))
      .join();

  String get plusDial => '+$dial';
}

const List<CountryCode> kCountryCodes = [
  CountryCode('India', 'IN', '91'),
  CountryCode('United States', 'US', '1'),
  CountryCode('United Kingdom', 'GB', '44'),
  CountryCode('Australia', 'AU', '61'),
  CountryCode('United Arab Emirates', 'AE', '971'),
  CountryCode('Afghanistan', 'AF', '93'),
  CountryCode('Albania', 'AL', '355'),
  CountryCode('Algeria', 'DZ', '213'),
  CountryCode('Andorra', 'AD', '376'),
  CountryCode('Angola', 'AO', '244'),
  CountryCode('Argentina', 'AR', '54'),
  CountryCode('Armenia', 'AM', '374'),
  CountryCode('Austria', 'AT', '43'),
  CountryCode('Azerbaijan', 'AZ', '994'),
  CountryCode('Bahrain', 'BH', '973'),
  CountryCode('Bangladesh', 'BD', '880'),
  CountryCode('Belarus', 'BY', '375'),
  CountryCode('Belgium', 'BE', '32'),
  CountryCode('Bhutan', 'BT', '975'),
  CountryCode('Bolivia', 'BO', '591'),
  CountryCode('Bosnia and Herzegovina', 'BA', '387'),
  CountryCode('Brazil', 'BR', '55'),
  CountryCode('Bulgaria', 'BG', '359'),
  CountryCode('Cambodia', 'KH', '855'),
  CountryCode('Cameroon', 'CM', '237'),
  CountryCode('Canada', 'CA', '1'),
  CountryCode('Chile', 'CL', '56'),
  CountryCode('China', 'CN', '86'),
  CountryCode('Colombia', 'CO', '57'),
  CountryCode('Costa Rica', 'CR', '506'),
  CountryCode('Croatia', 'HR', '385'),
  CountryCode('Cuba', 'CU', '53'),
  CountryCode('Cyprus', 'CY', '357'),
  CountryCode('Czech Republic', 'CZ', '420'),
  CountryCode('Denmark', 'DK', '45'),
  CountryCode('Ecuador', 'EC', '593'),
  CountryCode('Egypt', 'EG', '20'),
  CountryCode('Estonia', 'EE', '372'),
  CountryCode('Ethiopia', 'ET', '251'),
  CountryCode('Fiji', 'FJ', '679'),
  CountryCode('Finland', 'FI', '358'),
  CountryCode('France', 'FR', '33'),
  CountryCode('Georgia', 'GE', '995'),
  CountryCode('Germany', 'DE', '49'),
  CountryCode('Ghana', 'GH', '233'),
  CountryCode('Greece', 'GR', '30'),
  CountryCode('Hong Kong', 'HK', '852'),
  CountryCode('Hungary', 'HU', '36'),
  CountryCode('Iceland', 'IS', '354'),
  CountryCode('Indonesia', 'ID', '62'),
  CountryCode('Iran', 'IR', '98'),
  CountryCode('Iraq', 'IQ', '964'),
  CountryCode('Ireland', 'IE', '353'),
  CountryCode('Israel', 'IL', '972'),
  CountryCode('Italy', 'IT', '39'),
  CountryCode('Jamaica', 'JM', '1876'),
  CountryCode('Japan', 'JP', '81'),
  CountryCode('Jordan', 'JO', '962'),
  CountryCode('Kazakhstan', 'KZ', '7'),
  CountryCode('Kenya', 'KE', '254'),
  CountryCode('Kuwait', 'KW', '965'),
  CountryCode('Lebanon', 'LB', '961'),
  CountryCode('Libya', 'LY', '218'),
  CountryCode('Malaysia', 'MY', '60'),
  CountryCode('Maldives', 'MV', '960'),
  CountryCode('Mexico', 'MX', '52'),
  CountryCode('Morocco', 'MA', '212'),
  CountryCode('Myanmar', 'MM', '95'),
  CountryCode('Nepal', 'NP', '977'),
  CountryCode('Netherlands', 'NL', '31'),
  CountryCode('New Zealand', 'NZ', '64'),
  CountryCode('Nigeria', 'NG', '234'),
  CountryCode('Norway', 'NO', '47'),
  CountryCode('Oman', 'OM', '968'),
  CountryCode('Pakistan', 'PK', '92'),
  CountryCode('Palestine', 'PS', '970'),
  CountryCode('Panama', 'PA', '507'),
  CountryCode('Peru', 'PE', '51'),
  CountryCode('Philippines', 'PH', '63'),
  CountryCode('Poland', 'PL', '48'),
  CountryCode('Portugal', 'PT', '351'),
  CountryCode('Qatar', 'QA', '974'),
  CountryCode('Romania', 'RO', '40'),
  CountryCode('Russia', 'RU', '7'),
  CountryCode('Saudi Arabia', 'SA', '966'),
  CountryCode('Senegal', 'SN', '221'),
  CountryCode('Serbia', 'RS', '381'),
  CountryCode('Singapore', 'SG', '65'),
  CountryCode('South Africa', 'ZA', '27'),
  CountryCode('South Korea', 'KR', '82'),
  CountryCode('Spain', 'ES', '34'),
  CountryCode('Sri Lanka', 'LK', '94'),
  CountryCode('Sudan', 'SD', '249'),
  CountryCode('Sweden', 'SE', '46'),
  CountryCode('Switzerland', 'CH', '41'),
  CountryCode('Syria', 'SY', '963'),
  CountryCode('Taiwan', 'TW', '886'),
  CountryCode('Tanzania', 'TZ', '255'),
  CountryCode('Thailand', 'TH', '66'),
  CountryCode('Tunisia', 'TN', '216'),
  CountryCode('Turkey', 'TR', '90'),
  CountryCode('Uganda', 'UG', '256'),
  CountryCode('Ukraine', 'UA', '380'),
  CountryCode('Uruguay', 'UY', '598'),
  CountryCode('Uzbekistan', 'UZ', '998'),
  CountryCode('Venezuela', 'VE', '58'),
  CountryCode('Vietnam', 'VN', '84'),
  CountryCode('Yemen', 'YE', '967'),
  CountryCode('Zambia', 'ZM', '260'),
  CountryCode('Zimbabwe', 'ZW', '263'),
];

/// Look up by dial code (the form used internally — leading '+' stripped).
/// Returns India ('91') as a safe fallback if nothing matches.
CountryCode countryByDial(String dial) {
  for (final c in kCountryCodes) {
    if (c.dial == dial) return c;
  }
  return kCountryCodes.first;
}
