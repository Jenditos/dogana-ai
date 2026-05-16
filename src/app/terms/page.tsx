import LegalPage from '@/components/LegalPage'

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="17 May 2026">
      <h2>Purpose</h2>
      <p>
        DUDI AI Generator helps prepare customs data and ASYCUDA XML drafts from uploaded trade documents.
      </p>

      <h2>No automatic customs filing</h2>
      <p>
        AI-generated extraction results, tariff codes and XML outputs are assistance tools only. A qualified user must review all data before any official customs declaration.
      </p>

      <h2>User responsibility</h2>
      <ul>
        <li>Verify exporter, importer, invoice, goods, weight and package data.</li>
        <li>Confirm tariff codes manually before final export.</li>
        <li>Ensure that uploaded documents may lawfully be processed.</li>
        <li>Do not use Draft XML as a final customs declaration.</li>
      </ul>

      <h2>Availability</h2>
      <p>
        The application may depend on external AI providers, hosting infrastructure and customs reference data. Availability and extraction quality are not guaranteed.
      </p>

      <h2>Legal owner</h2>
      <p>
        <strong>Action required before public launch:</strong> replace this section with the operating company details, governing law, liability terms and support contact.
      </p>
    </LegalPage>
  )
}
