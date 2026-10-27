const sanitizeHtml = require('sanitize-html');

const COLOR = [
  /^#[0-9a-f]{3,8}$/i,
  /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i,
  /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)$/i
];

const LINE_HEIGHTS = new Set(['1', '1.15', '1.5', '1.75', '2']);

const withLineHeight = (tagName, attribs) => {
  const next = { ...attribs };
  if (!LINE_HEIGHTS.has(next['data-line-height'] || '')) delete next['data-line-height'];
  return { tagName, attribs: next };
};

const sanitizeOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'h1',
    'h2',
    'h3',
    'ul',
    'ol',
    'li',
    'a',
    'img',
    'span',
    'mark',
    'blockquote',
    'pre',
    'code',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'label',
    'input',
    'div'
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['alt', 'data-attachment-id'],
    span: ['style'],
    mark: ['style', 'data-color'],
    p: ['style', 'data-line-height'],
    h1: ['style', 'data-line-height'],
    h2: ['style', 'data-line-height'],
    h3: ['style', 'data-line-height'],
    li: ['style', 'data-type', 'data-checked'],
    ul: ['data-type'],
    ol: ['start'],
    td: ['colspan', 'rowspan', 'style'],
    th: ['colspan', 'rowspan', 'style'],
    input: ['type', 'checked', 'disabled'],
    div: ['style']
  },
  allowedStyles: {
    '*': {
      color: COLOR,
      'background-color': COLOR,
      'text-align': [/^(left|center|right|justify)$/],
      'font-size': [/^(12|14|16|18|20|24|28)px$/]
    }
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: [] },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        target: '_blank',
        rel: 'noopener noreferrer'
      }
    }),
    input: (tagName, attribs) => ({
      tagName,
      attribs: {
        type: attribs.type === 'checkbox' ? 'checkbox' : 'text',
        ...(attribs.checked !== undefined ? { checked: 'checked' } : {})
      }
    }),
    p: withLineHeight,
    h1: withLineHeight,
    h2: withLineHeight,
    h3: withLineHeight
  },
  exclusiveFilter: (frame) => {
    if (frame.tag !== 'img') return false;
    return !/^\d+$/.test(frame.attribs['data-attachment-id'] || '');
  }
};

const sanitizeDescription = (value) => sanitizeHtml(String(value || ''), sanitizeOptions);

const isEmptyDescription = (value) => {
  const clean = sanitizeDescription(value);
  const text = sanitizeHtml(clean, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text) return false;
  return !/data-attachment-id="\d+"/.test(clean);
};

module.exports = { sanitizeDescription, isEmptyDescription };
