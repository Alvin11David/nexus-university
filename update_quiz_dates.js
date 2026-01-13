import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oszbmaqieyemkgcqbeap.supabase.co',
  'sb_publishable_BFaFrQY16mkqYHF5mri5ow_f94fPHjF'
);

async function updateQuizDates() {
  try {
    console.log('Updating quiz dates to make it currently active...\n');

    // Calculate new dates: start now, end in 1 week
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    console.log('New start date:', now.toISOString());
    console.log('New end date:', oneWeekFromNow.toISOString());

    const { data, error } = await supabase
      .from('quizzes')
      .update({
        start_date: now.toISOString(),
        end_date: oneWeekFromNow.toISOString()
      })
      .eq('id', 'edf5eaf5-c24c-4785-a70d-f5eb3425143e') // The quiz ID from the logs
      .select();

    if (error) {
      console.log('Update error:', error);
    } else {
      console.log('Quiz updated successfully:', data);
    }

  } catch (err) {
    console.error('Script error:', err);
  }
}

updateQuizDates();