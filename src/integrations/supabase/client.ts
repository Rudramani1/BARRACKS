
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://agusneaougutwpitderb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFndXNuZWFvdWd1dHdwaXRkZXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTM3MzUsImV4cCI6MjA1OTA4OTczNX0.7LlPcbyBYalUAJD_fkseLYl3vBnU0hBhtdtVILT5Yv8";


export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
