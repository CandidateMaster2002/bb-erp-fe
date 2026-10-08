export interface Client {
  id: number;
  name: string;
}

export interface Vendor {
  id: number;
  name: string;
}

export interface Requirement {
  id: number;
  demandSourceId: number;
  title: string;
  jdText: string;
  ctc: string;
  noticePeriod: string;
  experienceRange: string;
  description: string;
  client?: Client;
}
