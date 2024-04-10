/// <reference types="react-scripts" />
declare module '*.pdf';
declare global {
    namespace NodeJS {
      interface ProcessEnv {
        FACT_API_KEY:string;
      }
     }
   }