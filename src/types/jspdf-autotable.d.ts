// TypeScript type augmentation for jsPDF autotable
import 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (...args: any[]) => any;
    lastAutoTable?: any;
  }
}
