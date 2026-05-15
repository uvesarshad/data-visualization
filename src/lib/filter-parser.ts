// 3.1: Simple filter parser for NL query filters
// Parses expressions like "column = value", "column > 100", "column contains X"

type FilterOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'not_contains';

interface ParsedFilter {
  column: string;
  operator: FilterOperator;
  value: string;
}

/**
 * Parse a filter expression string into a structured filter
 */
export function parseFilterExpression(expr: string): ParsedFilter | null {
  if (!expr || typeof expr !== 'string') return null;
  
  const trimmed = expr.trim();
  
  // Try operators in order of longest first to avoid partial matches
  const operators: { op: FilterOperator; pattern: RegExp }[] = [
    { op: '>=', pattern: /^(.+?)\s*>=\s*(.+)$/ },
    { op: '<=', pattern: /^(.+?)\s*<=\s*(.+)$/ },
    { op: '!=', pattern: /^(.+?)\s*!=\s*(.+)$/ },
    // Treat SQL-style "<>" as != for tolerance
    { op: '!=', pattern: /^(.+?)\s*<>\s*(.+)$/ },
    { op: 'not_contains', pattern: /^(.+?)\s+not\s+contains\s+(.+)$/i },
    { op: 'contains', pattern: /^(.+?)\s+contains\s+(.+)$/i },
    { op: '>', pattern: /^(.+?)\s*>\s*(.+)$/ },
    { op: '<', pattern: /^(.+?)\s*<\s*(.+)$/ },
    // == before = so it's preferred when present
    { op: '=', pattern: /^(.+?)\s*==\s*(.+)$/ },
    { op: '=', pattern: /^(.+?)\s*=\s*(.+)$/ },
  ];

  for (const { op, pattern } of operators) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        column: match[1].trim(),
        operator: op,
        value: match[2].trim().replace(/^["']|["']$/g, ''), // strip quotes
      };
    }
  }

  return null;
}

/**
 * Apply a parsed filter to a data array
 */
export function applyFilter(data: any[], filter: ParsedFilter): any[] {
  if (!filter || !data) return data;
  
  return data.filter(row => {
    const cellValue = row[filter.column];
    if (cellValue === undefined || cellValue === null) return false;

    const cellStr = String(cellValue).toLowerCase();
    const filterVal = filter.value.toLowerCase();

    // Try numeric comparison
    const cellNum = Number(cellValue);
    const filterNum = Number(filter.value);
    const isNumeric = !isNaN(cellNum) && !isNaN(filterNum);

    switch (filter.operator) {
      case '=':
        return isNumeric ? cellNum === filterNum : cellStr === filterVal;
      case '!=':
        return isNumeric ? cellNum !== filterNum : cellStr !== filterVal;
      case '>':
        return isNumeric ? cellNum > filterNum : cellStr > filterVal;
      case '<':
        return isNumeric ? cellNum < filterNum : cellStr < filterVal;
      case '>=':
        return isNumeric ? cellNum >= filterNum : cellStr >= filterVal;
      case '<=':
        return isNumeric ? cellNum <= filterNum : cellStr <= filterVal;
      case 'contains':
        return cellStr.includes(filterVal);
      case 'not_contains':
        return !cellStr.includes(filterVal);
      default:
        return true;
    }
  });
}

/**
 * Parse and apply a filter expression to data in one step
 */
export function filterData(data: any[], filterExpr: string | undefined): { data: any[]; filter: ParsedFilter | null } {
  if (!filterExpr) return { data, filter: null };
  
  const parsed = parseFilterExpression(filterExpr);
  if (!parsed) return { data, filter: null };
  
  return { data: applyFilter(data, parsed), filter: parsed };
}