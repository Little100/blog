import { printParseErrorCode } from 'jsonc-parser'
import type { Locale } from './translations'

type ErrKey = ReturnType<typeof printParseErrorCode>

const BY_LOCALE: Record<Locale, Partial<Record<ErrKey, string>>> = {
  en: {
    InvalidSymbol: 'Invalid symbol',
    InvalidNumberFormat: 'Invalid number format',
    PropertyNameExpected: 'Property name expected',
    ValueExpected: 'Value expected',
    ColonExpected: 'Colon expected',
    CommaExpected: 'Comma expected',
    CloseBraceExpected: 'Closing brace expected',
    CloseBracketExpected: 'Closing bracket expected',
    EndOfFileExpected: 'End of file expected',
    InvalidCommentToken: 'Invalid comment',
    UnexpectedEndOfComment: 'Unexpected end of comment',
    UnexpectedEndOfString: 'Unexpected end of string',
    UnexpectedEndOfNumber: 'Unexpected end of number',
    InvalidUnicode: 'Invalid Unicode escape',
    InvalidEscapeCharacter: 'Invalid escape character',
    InvalidCharacter: 'Invalid character',
  },
  ja: {
    InvalidSymbol: '無効な記号です',
    InvalidNumberFormat: '数値の形式が正しくありません',
    PropertyNameExpected: 'プロパティ名が必要です',
    ValueExpected: '値が必要です',
    ColonExpected: 'コロン（:）が必要です',
    CommaExpected: 'カンマが必要です',
    CloseBraceExpected: '閉じ括弧「}」が必要です',
    CloseBracketExpected: '閉じ括弧「]」が必要です',
    EndOfFileExpected: 'ここで入力は終わるべきです',
    InvalidCommentToken: 'コメントが無効です',
    UnexpectedEndOfComment: 'コメントが途中で終わりました',
    UnexpectedEndOfString: '文字列が途中で終わりました',
    UnexpectedEndOfNumber: '数値が途中で終わりました',
    InvalidUnicode: 'Unicode エスケープが無効です',
    InvalidEscapeCharacter: 'エスケープ文字が無効です',
    InvalidCharacter: '無効な文字です',
  },
  zh: {
    InvalidSymbol: '无效的符号',
    InvalidNumberFormat: '数字格式无效',
    PropertyNameExpected: '此处需要属性名',
    ValueExpected: '此处需要值',
    ColonExpected: '此处需要冒号（:）',
    CommaExpected: '此处需要逗号',
    CloseBraceExpected: '此处需要右花括号（}）',
    CloseBracketExpected: '此处需要右方括号（]）',
    EndOfFileExpected: '此处应为文件结尾',
    InvalidCommentToken: '注释无效',
    UnexpectedEndOfComment: '注释意外结束',
    UnexpectedEndOfString: '字符串意外结束',
    UnexpectedEndOfNumber: '数字意外结束',
    InvalidUnicode: '无效的 Unicode 转义',
    InvalidEscapeCharacter: '无效的转义字符',
    InvalidCharacter: '无效字符',
  },
  'zh-TW': {
    InvalidSymbol: '無效的符號',
    InvalidNumberFormat: '數字格式無效',
    PropertyNameExpected: '此處需要屬性名稱',
    ValueExpected: '此處需要值',
    ColonExpected: '此處需要冒號（:）',
    CommaExpected: '此處需要逗號',
    CloseBraceExpected: '此處需要右花括號（}）',
    CloseBracketExpected: '此處需要右方括號（]）',
    EndOfFileExpected: '此處應為檔案結尾',
    InvalidCommentToken: '註解無效',
    UnexpectedEndOfComment: '註解意外結束',
    UnexpectedEndOfString: '字串意外結束',
    UnexpectedEndOfNumber: '數字意外結束',
    InvalidUnicode: '無效的 Unicode 轉義',
    InvalidEscapeCharacter: '無效的跳脫字元',
    InvalidCharacter: '無效字元',
  },
}

export function jsonParseErrorMessage(locale: Locale, errorCode: number): string {
  const key = printParseErrorCode(errorCode as never)
  const localized = BY_LOCALE[locale][key]
  if (localized) return localized
  const en = BY_LOCALE.en[key]
  if (en) return en
  return 'JSON syntax error'
}
