import LegalPage from '@/components/LegalPage'

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="17 May 2026">
      <p>
        DUDI AI Generator processes customs-related documents to extract invoice, packing list and tariff data for ASYCUDA XML preparation.
      </p>

      <h2>Data processed</h2>
      <ul>
        <li>Uploaded documents such as invoices, packing lists, CMR and EUR.1 files.</li>
        <li>Extracted company, invoice, goods, weight, package and tariff information.</li>
        <li>Voice recordings or transcripts when the voice input feature is used.</li>
        <li>Technical request metadata needed for security, rate limiting and troubleshooting.</li>
      </ul>

      <h2>AI processing</h2>
      <p>
        Uploaded documents and voice data may be sent to configured AI providers for extraction and transcription. Users must verify AI-generated customs data before final filing.
      </p>

      <h2>Storage</h2>
      <p>
        The application is designed to process files for the active session. Do not upload documents unless you are authorized to process them.
      </p>

      <h2>Security</h2>
      <p>
        Access protection can be enabled with DOGANA_ACCESS_TOKEN. Rate limiting is applied to cost-sensitive API routes, with optional Redis-backed persistence.
      </p>

      <h2>Controller details</h2>
      <p>
        <strong>Action required before public launch:</strong> add the responsible legal entity, address, contact email, data protection contact and applicable jurisdiction.
      </p>
    </LegalPage>
  )
}
