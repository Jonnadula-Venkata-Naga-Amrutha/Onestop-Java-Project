import JSZip from 'jszip';

export async function downloadDatabaseSetupZip() {
  const [schemaResponse, seedResponse] = await Promise.all([
    fetch('/schema.sql'),
    fetch('/seed.sql'),
  ]);
  if (!schemaResponse.ok || !seedResponse.ok) {
    throw new Error('The MySQL schema and seed files could not be loaded.');
  }

  const zip = new JSZip();
  zip.file('schema.sql', await schemaResponse.text());
  zip.file('seed.sql', await seedResponse.text());
  zip.file('README.txt', [
    'ONESTOP MySQL setup files',
    '',
    'Apply schema.sql to create the onestop_db schema, then optionally apply seed.sql for demo data.',
    'The backend application source remains in the ONESTOP repository under backend/java.',
    'For existing databases, apply the additive migrations in backend/database/migrations.',
    'Configure MYSQL_HOST, MYSQL_PORT, MYSQL_DB, MYSQL_USER, MYSQL_PASSWORD in the Tomcat environment.',
    'DEVELOPMENT ONLY: demo accounts use the shared password password123. Never load seed.sql or use these accounts in production.',
    'Public registration does not create administrator accounts; provision production administrators with a unique, privately generated BCrypt password hash.',
    '',
  ].join('\r\n'));

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'onestop-database-setup.zip';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
