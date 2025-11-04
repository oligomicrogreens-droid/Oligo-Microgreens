// A function to escape CSV values
const escapeCSV = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  // If the value contains a comma, double quote, or newline, wrap it in double quotes
  if (/[",\n]/.test(stringValue)) {
    // Also, double up any existing double quotes
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export const downloadCSV = (data: Record<string, any>[], filename: string): void => {
  if (!data || data.length === 0) {
    alert("No data to export.");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row =>
      headers.map(header => escapeCSV(row[header])).join(',')
    )
  ];
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) { // Feature detection
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
