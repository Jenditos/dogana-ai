import LegalPage from '@/components/LegalPage'

export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum" updated="17 May 2026">
      <p>
        <strong>Action required before public launch:</strong> complete this page with the legally responsible operator details.
      </p>

      <h2>Operator</h2>
      <p>
        Company / Sole proprietor: TODO<br />
        Address: TODO<br />
        Country: TODO
      </p>

      <h2>Contact</h2>
      <p>
        Email: TODO<br />
        Phone: TODO
      </p>

      <h2>Registration and tax</h2>
      <p>
        Business registration number: TODO<br />
        VAT / tax number: TODO
      </p>

      <h2>Responsible for content</h2>
      <p>
        Name and address: TODO
      </p>
    </LegalPage>
  )
}
