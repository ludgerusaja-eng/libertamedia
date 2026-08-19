import React, { useState } from 'react';
import { api } from '../services/api';
import { CategoryType, CitizenSubmission } from '../types';

// Keep the existing UI/state implementation; only normalize the production API payload.
export function normalizeCitizenSubmission(formData: { title:string; category:CategoryType; authorName:string; email:string; institution?:string; abstract?:string; content:string }) : Omit<CitizenSubmission,'id'|'submittedAt'> {
  return { title: formData.title.trim(), category: formData.category, authorName: formData.authorName.trim(), authorEmail: formData.email.trim(), authorOrg: formData.institution?.trim() || undefined, content: `${formData.abstract?.trim() ? formData.abstract.trim() + '\n\n' : ''}${formData.content.trim()}` };
}
