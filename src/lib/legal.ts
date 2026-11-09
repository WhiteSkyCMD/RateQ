import type { Lang } from "./i18n";

export const COMPANY = {
  name: "Heijthuijzen Trading & Services B.V.",
  kvk: "99428946",
  vat: "NL868987098B01",
  email: "info@rateq.nl",
};

export type LegalDoc = { title: string; intro: string; sections: { h: string; p: string[] }[] };
export type LegalKey = "privacy" | "terms" | "dpa";

const C = COMPANY;

export const LEGAL: Record<LegalKey, Record<Lang, LegalDoc>> = {
  privacy: {
    nl: {
      title: "Privacybeleid",
      intro: `RateQ is een dienst van ${C.name} (KvK ${C.kvk}). In dit privacybeleid leggen we uit welke persoonsgegevens we verwerken, waarom en hoe we die beschermen.`,
      sections: [
        { h: "1. Wie zijn wij", p: [`${C.name}, ingeschreven bij de Kamer van Koophandel onder nummer ${C.kvk}, btw-nummer ${C.vat}. Voor vragen over privacy bereik je ons via ${C.email}.`] },
        { h: "2. Welke gegevens verwerken we", p: ["Van ondernemers (onze klanten): naam, e-mailadres, bedrijfsnaam, betaalgegevens (via Stripe) en gebruiksgegevens van het dashboard.", "Van de klanten van ondernemers: naam, telefoonnummer, e-mailadres, de gegeven beoordeling en eventuele feedback. Deze gegevens verwerken wij in opdracht van de ondernemer (zie de verwerkersovereenkomst)."] },
        { h: "3. Waarom verwerken we deze gegevens", p: ["Om de dienst te leveren (reviewverzoeken versturen per sms en e-mail), om abonnementen te factureren, om je te informeren over je account en om de dienst te verbeteren en te beveiligen. Grondslagen: uitvoering van de overeenkomst, wettelijke verplichting en gerechtvaardigd belang."] },
        { h: "4. Delen met derden", p: ["We schakelen zorgvuldig geselecteerde verwerkers in: hosting en database-infrastructuur, Twilio (sms), Resend (e-mail) en Stripe (betalingen). Met hen zijn passende afspraken gemaakt. We verkopen nooit gegevens."] },
        { h: "5. Bewaartermijnen", p: ["Accountgegevens bewaren we zolang je account actief is. Na opzegging verwijderen we gegevens binnen 90 dagen, tenzij een wettelijke bewaarplicht geldt (zoals 7 jaar voor facturen)."] },
        { h: "6. Beveiliging", p: ["Gegevens worden versleuteld verzonden en opgeslagen. Toegang is per bedrijf afgeschermd en medewerkers zien alleen wat zij nodig hebben."] },
        { h: "7. Jouw rechten", p: [`Je hebt recht op inzage, correctie, verwijdering, beperking, overdraagbaarheid en bezwaar. Stuur je verzoek naar ${C.email}. Je kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens.`] },
        { h: "8. Cookies", p: ["We gebruiken alleen functionele opslag die nodig is om in te loggen en je taalvoorkeur te onthouden. We gebruiken geen trackingcookies van derden."] },
      ],
    },
    en: {
      title: "Privacy policy",
      intro: `RateQ is a service of ${C.name} (Chamber of Commerce ${C.kvk}). This policy explains which personal data we process, why, and how we protect it.`,
      sections: [
        { h: "1. Who we are", p: [`${C.name}, registered with the Dutch Chamber of Commerce under number ${C.kvk}, VAT number ${C.vat}. Privacy questions: ${C.email}.`] },
        { h: "2. Data we process", p: ["From business owners (our customers): name, email address, business name, payment details (via Stripe) and dashboard usage data.", "From customers of business owners: name, phone number, email address, the rating given and any feedback. We process this data on behalf of the business (see the data processing agreement)."] },
        { h: "3. Why we process data", p: ["To deliver the service (sending review requests by SMS and email), to bill subscriptions, to inform you about your account and to improve and secure the service. Legal bases: performance of contract, legal obligation and legitimate interest."] },
        { h: "4. Sharing with third parties", p: ["We use carefully selected processors: hosting and database infrastructure, Twilio (SMS), Resend (email) and Stripe (payments). Appropriate agreements are in place. We never sell data."] },
        { h: "5. Retention", p: ["Account data is kept while your account is active. After cancellation we delete data within 90 days unless a legal retention obligation applies (such as 7 years for invoices)."] },
        { h: "6. Security", p: ["Data is encrypted in transit and at rest. Access is isolated per business and staff only see what they need."] },
        { h: "7. Your rights", p: [`You have the right to access, rectify, erase, restrict, port and object. Send your request to ${C.email}. You may also lodge a complaint with the Dutch Data Protection Authority.`] },
        { h: "8. Cookies", p: ["We only use functional storage needed to sign in and remember your language. We do not use third-party tracking cookies."] },
      ],
    },
  },
  terms: {
    nl: {
      title: "Algemene voorwaarden",
      intro: `Deze voorwaarden zijn van toepassing op elk gebruik van RateQ, een dienst van ${C.name} (KvK ${C.kvk}, btw ${C.vat}).`,
      sections: [
        { h: "1. Definities", p: ["RateQ / wij: " + C.name + ". Klant: de onderneming die een account aanmaakt. Dienst: het RateQ-platform voor het versturen van reviewverzoeken en het beheren van feedback."] },
        { h: "2. Toepasselijkheid", p: ["RateQ richt zich uitsluitend op ondernemers (B2B). Door een account aan te maken ga je akkoord met deze voorwaarden. Afwijkingen gelden alleen als we die schriftelijk hebben bevestigd."] },
        { h: "3. Abonnementen & betaling", p: ["Abonnementen worden per maand of per jaar vooruit gefactureerd via Stripe. Alle prijzen zijn exclusief btw tenzij anders vermeld. Losse berichten-credits vervallen niet zolang het account actief is. Bij een mislukte betaling kunnen we de dienst opschorten."] },
        { h: "4. Opzeggen", p: ["Je kunt je abonnement op elk moment opzeggen via het dashboard. Het abonnement loopt door tot het einde van de lopende periode; reeds betaalde bedragen worden niet gerestitueerd."] },
        { h: "5. Gebruik van de dienst", p: ["Je stuurt alleen berichten naar personen met wie je een klantrelatie hebt en die redelijkerwijs een bericht verwachten. Je bent zelf verantwoordelijk voor de juistheid van de ingevoerde gegevens en voor naleving van de regels van reviewplatforms zoals Google, Trustpilot en Facebook. Misbruik (spam, misleiding) leidt tot directe beëindiging."] },
        { h: "6. Beschikbaarheid", p: ["We streven naar een zo hoog mogelijke beschikbaarheid, maar garanderen geen ononderbroken werking. Levering van sms en e-mail is afhankelijk van externe partijen."] },
        { h: "7. Aansprakelijkheid", p: ["Onze aansprakelijkheid is beperkt tot directe schade en tot maximaal het bedrag dat je in de drie maanden voorafgaand aan de schade aan ons hebt betaald. We zijn niet aansprakelijk voor indirecte schade, gederfde omzet of de inhoud van reviews."] },
        { h: "8. Gegevens", p: ["Voor de verwerking van persoonsgegevens van jouw klanten geldt onze verwerkersovereenkomst, die onderdeel is van deze voorwaarden."] },
        { h: "9. Toepasselijk recht", p: ["Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in Nederland."] },
      ],
    },
    en: {
      title: "Terms and conditions",
      intro: `These terms apply to all use of RateQ, a service of ${C.name} (Chamber of Commerce ${C.kvk}, VAT ${C.vat}).`,
      sections: [
        { h: "1. Definitions", p: ["RateQ / we: " + C.name + ". Customer: the business that creates an account. Service: the RateQ platform for sending review requests and managing feedback."] },
        { h: "2. Applicability", p: ["RateQ is intended exclusively for businesses (B2B). By creating an account you accept these terms. Deviations only apply when confirmed by us in writing."] },
        { h: "3. Subscriptions & payment", p: ["Subscriptions are billed monthly or yearly in advance via Stripe. Prices exclude VAT unless stated otherwise. Extra message credits do not expire while the account is active. We may suspend the service after a failed payment."] },
        { h: "4. Cancellation", p: ["You can cancel at any time in the dashboard. The subscription remains active until the end of the current period; amounts already paid are not refunded."] },
        { h: "5. Use of the service", p: ["Only send messages to people you have a customer relationship with and who can reasonably expect a message. You are responsible for the accuracy of entered data and for complying with the rules of review platforms such as Google, Trustpilot and Facebook. Abuse (spam, deception) leads to immediate termination."] },
        { h: "6. Availability", p: ["We aim for maximum availability but do not guarantee uninterrupted operation. Delivery of SMS and email depends on third parties."] },
        { h: "7. Liability", p: ["Our liability is limited to direct damage and to the amount you paid us in the three months before the damage occurred. We are not liable for indirect damage, lost revenue or the content of reviews."] },
        { h: "8. Data", p: ["Processing of your customers' personal data is governed by our data processing agreement, which forms part of these terms."] },
        { h: "9. Governing law", p: ["These terms are governed by Dutch law. Disputes are submitted to the competent court in the Netherlands."] },
      ],
    },
  },
  dpa: {
    nl: {
      title: "Verwerkersovereenkomst",
      intro: `Deze verwerkersovereenkomst (art. 28 AVG) geldt tussen de klant (verwerkingsverantwoordelijke) en ${C.name}, KvK ${C.kvk} (verwerker), en maakt deel uit van de algemene voorwaarden van RateQ.`,
      sections: [
        { h: "1. Onderwerp", p: ["De verwerker verwerkt persoonsgegevens uitsluitend om de RateQ-dienst te leveren: het opslaan van klantgegevens, het versturen van reviewverzoeken en herinneringen per sms en e-mail, en het registreren van beoordelingen en feedback."] },
        { h: "2. Soorten gegevens en betrokkenen", p: ["Betrokkenen: klanten van de verwerkingsverantwoordelijke. Gegevens: naam, telefoonnummer, e-mailadres, beoordeling, feedbacktekst en tijdstippen. Er worden geen bijzondere persoonsgegevens verwerkt."] },
        { h: "3. Instructies", p: ["De verwerker handelt alleen op basis van schriftelijke instructies van de verwerkingsverantwoordelijke, waaronder het gebruik van het dashboard. De verwerkingsverantwoordelijke garandeert dat er een geldige grondslag is om de betrokkenen te benaderen."] },
        { h: "4. Geheimhouding & beveiliging", p: ["Personen met toegang zijn tot geheimhouding verplicht. De verwerker neemt passende technische en organisatorische maatregelen, waaronder versleuteling, toegangsbeheer per bedrijf en logging."] },
        { h: "5. Subverwerkers", p: ["De verwerkingsverantwoordelijke geeft toestemming voor de volgende subverwerkers: hosting/database-infrastructuur, Twilio (sms), Resend (e-mail) en Stripe (betalingen). Wijzigingen worden vooraf gemeld; de klant kan hiertegen bezwaar maken."] },
        { h: "6. Datalekken", p: ["De verwerker meldt een datalek zonder onredelijke vertraging en uiterlijk binnen 48 uur na ontdekking aan de verwerkingsverantwoordelijke, met alle informatie die nodig is voor een eventuele melding aan de Autoriteit Persoonsgegevens."] },
        { h: "7. Rechten van betrokkenen", p: ["De verwerker helpt de verwerkingsverantwoordelijke bij verzoeken van betrokkenen. Gegevens kunnen in het dashboard worden ingezien, geëxporteerd en verwijderd."] },
        { h: "8. Duur en beëindiging", p: ["Deze overeenkomst geldt zolang de dienst wordt afgenomen. Na beëindiging worden de persoonsgegevens binnen 90 dagen verwijderd, tenzij de klant vooraf om een export vraagt."] },
        { h: "9. Audit", p: ["De verwerkingsverantwoordelijke kan informatie opvragen om naleving van deze overeenkomst te controleren. Redelijke kosten van een audit zijn voor rekening van de verwerkingsverantwoordelijke."] },
      ],
    },
    en: {
      title: "Data processing agreement",
      intro: `This data processing agreement (Art. 28 GDPR) applies between the customer (controller) and ${C.name}, Chamber of Commerce ${C.kvk} (processor), and forms part of RateQ's terms and conditions.`,
      sections: [
        { h: "1. Subject", p: ["The processor processes personal data solely to deliver the RateQ service: storing customer data, sending review requests and reminders by SMS and email, and recording ratings and feedback."] },
        { h: "2. Data and data subjects", p: ["Data subjects: customers of the controller. Data: name, phone number, email address, rating, feedback text and timestamps. No special categories of personal data are processed."] },
        { h: "3. Instructions", p: ["The processor only acts on documented instructions of the controller, including use of the dashboard. The controller warrants a valid legal basis for contacting data subjects."] },
        { h: "4. Confidentiality & security", p: ["Persons with access are bound by confidentiality. The processor takes appropriate technical and organisational measures, including encryption, per-business access control and logging."] },
        { h: "5. Sub-processors", p: ["The controller authorises the following sub-processors: hosting/database infrastructure, Twilio (SMS), Resend (email) and Stripe (payments). Changes are announced in advance; the customer may object."] },
        { h: "6. Data breaches", p: ["The processor notifies the controller of a data breach without undue delay and no later than 48 hours after discovery, with all information needed for a possible notification to the supervisory authority."] },
        { h: "7. Data subject rights", p: ["The processor assists the controller with data subject requests. Data can be viewed, exported and deleted in the dashboard."] },
        { h: "8. Term and termination", p: ["This agreement applies while the service is used. After termination personal data is deleted within 90 days unless the customer requests an export beforehand."] },
        { h: "9. Audit", p: ["The controller may request information to verify compliance with this agreement. Reasonable audit costs are borne by the controller."] },
      ],
    },
  },
};
