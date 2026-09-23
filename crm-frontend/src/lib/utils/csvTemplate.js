// Column names here match what ColumnMapper/importParser.service.js
// ultimately map to Lead fields (businessName, cityName, stateCode,
// address, lat, lng, phone, email, website, mapsRating, mapsReviewCount,
// placeId). Using these exact header names means a founder can skip the
// column-mapping step entirely if they upload the template as-is, since
// most import tools auto-match identical header names - though mapping
// still works fine if they rename columns.
const TEMPLATE_HEADERS = [
  'businessName',
  'cityName',
  'stateCode',
  'address',
  'phone',
  'email',
  'website',
  'lat',
  'lng',
  'mapsRating',
  'mapsReviewCount',
  'placeId',
];

const DUMMY_ROW = {
  businessName: 'Rudrashri Events & Decor',
  cityName: 'Indore',
  stateCode: 'MP',
  address: '2 Sanskruti Smart City, near Aurobindo Hospital, Bhawrasla, Indore, Madhya Pradesh 453555',
  phone: '9876543210',
  email: 'contact@rudrashrievents.com',
  website: 'https://rudrashrievents.com',
  lat: '22.7196',
  lng: '75.8577',
  mapsRating: '4.5',
  mapsReviewCount: '120',
  placeId: 'ChIJexampleplaceid123',
};

function escapeCsvValue(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Builds and downloads a CSV template with the standard headers plus one
 * dummy row so whoever fills it in can see the expected format at a glance.
 * Optionally appends the selected category's custom field names as extra
 * trailing columns (informational only - see note in ImportDataPage.jsx
 * about how these currently aren't auto-mapped on commit).
 */
export function downloadImportTemplate(category = null) {
  const headers = [...TEMPLATE_HEADERS];
  const dummyRow = { ...DUMMY_ROW };

  if (category?.customFields?.length) {
    category.customFields.forEach((field) => {
      headers.push(field.fieldName);
      dummyRow[field.fieldName] =
        field.fieldType === 'dropdown' && field.options?.length
          ? field.options[0]
          : field.fieldType === 'number'
          ? '0'
          : field.fieldType === 'date'
          ? '2026-01-01'
          : 'sample value';
    });
  }

  const headerLine = headers.map(escapeCsvValue).join(',');
  const dummyLine = headers.map((h) => escapeCsvValue(dummyRow[h])).join(',');
  const csvContent = `${headerLine}\n${dummyLine}\n`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = category
    ? `campussafar-lead-template-${category.name.toLowerCase().replace(/\s+/g, '-')}.csv`
    : 'campussafar-lead-template.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export { TEMPLATE_HEADERS };
