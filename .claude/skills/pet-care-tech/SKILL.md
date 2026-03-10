# Pet Care Tech — Veterinary & Pet Services SaaS

Platforms for veterinary clinics, pet insurance, pet boarding/grooming, and D2C pet wellness brands.

## When to Use
- Building veterinary practice management software (scheduling, SOAP notes, billing)
- Pet insurance quoting, claims automation, wellness plan subscriptions
- Pet boarding, daycare, grooming booking + staff scheduling
- D2C pet food/supplements: subscription, auto-ship, personalization
- Pet health monitoring: wearables, telehealth vet consults

## Key Concepts

| Term | Meaning |
|------|---------|
| SOAP Note | Subjective, Objective, Assessment, Plan — vet clinical note |
| AWI | Annual Wellness Incentive (pet insurance) |
| AVMA | American Veterinary Medical Association standards |
| Rx Diet | Prescription diet (requires vet auth) |
| Microchip ID | ISO 11784/11785 pet identification standard |
| PetPoint | Shelter management system (API target) |
| VCPR | Veterinarian-Client-Patient Relationship (telehealth legal req) |

## Core Modules

```
Veterinary Practice Management
  ├── Appointment Scheduler (species/vet/room routing)
  ├── Digital SOAP Notes + Treatment Plans
  ├── Prescription Management (DEA controlled substances log)
  ├── Inventory: Vaccines, Medications, Supplies
  └── Client/Patient Portal (records, reminders, invoices)

Pet Insurance & Wellness Plans
  ├── Breed-based Risk Scoring + Quote Engine
  ├── Claims Submission → EOB Generation
  ├── Annual Wellness Plan Billing (recurring)
  └── Multi-pet Household Management

Pet Services Marketplace
  ├── Grooming/Boarding/Training Booking
  ├── Staff Scheduling + Capacity Management
  ├── Pet Profile (breed, weight, allergies, vet records)
  └── Post-service Report Cards + Photos

D2C Pet Brand
  ├── Personalized Nutrition Recommendation (quiz → formula)
  ├── Auto-ship Subscription (pause, skip, swap)
  ├── Weight/Health Milestone Tracker
  └── Telehealth Vet Consult Booking
```

## Key Integrations

| Category | Services |
|----------|---------|
| Payments | Stripe, CareCredit (vet financing) |
| E-Prescribe | Vetsource, Covetrus, Henry Schein |
| Lab Results | IDEXX (Cornerstone API), Zoetis, Antech |
| Wearables | Whistle, Fi Collar, PetPace (IoT) |
| Insurance APIs | Trupanion, Nationwide Pet, Lemonade Pet |
| Reminders/Comms | Twilio SMS, PetDesk, VitusVet |
| Microchip Lookup | AAHA Universal Pet Microchip Lookup API |

## Implementation Patterns

```typescript
interface PetProfile {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'rabbit' | 'bird' | 'reptile' | 'other';
  breed: string;
  dob: string;
  weightKg: number;
  microchipId?: string;
  allergies: string[];
  medications: ActiveMedication[];
  vaccinations: VaccinationRecord[];
  insurancePolicyId?: string;
}

interface SOAPNote {
  appointmentId: string;
  petId: string;
  vetId: string;
  subjective: string;   // owner-reported symptoms
  objective: string;    // physical exam findings
  assessment: string;   // diagnosis / differential
  plan: string;         // treatment, prescriptions, follow-up
  diagnoses: ICD10VMCode[];
  prescriptions: Prescription[];
  createdAt: string;
}

interface InsuranceClaim {
  claimId: string;
  petId: string;
  invoiceId: string;
  totalAmount: number;
  coveredAmount?: number;
  status: 'submitted' | 'in_review' | 'approved' | 'denied' | 'paid';
  denialReason?: string;
}
```

## SDK
`@agencyos/vibe-pet-care` — pet profiles, SOAP notes, appointment routing, insurance claim helpers
