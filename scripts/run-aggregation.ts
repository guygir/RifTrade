import { aggregateMetaData } from '../lib/meta-data/meta-aggregator';

console.log('Starting meta aggregation...');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

aggregateMetaData(supabaseUrl, supabaseKey)
  .then((result) => {
    console.log('✅ Aggregation complete!', result);
    process.exit(0);
  })
  .catch((error: Error) => {
    console.error('❌ Aggregation failed:', error);
    process.exit(1);
  });

// Made with Bob
