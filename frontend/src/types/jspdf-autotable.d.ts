// src/types/jspdf-autotable.d.ts

declare module 'jspdf-autotable' {
  import jsPDF from 'jspdf';
  
  interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => any;
  }

  function autoTable(doc: jsPDF, options: any): void;

  export default autoTable;
}