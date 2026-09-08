require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });

const REQUIRED = ['DATABASE_URL', 'JWT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];

// mayukh: ahh these are placeholders matched against any of the REQ item checks
// mayukh: must remove the 'your_' placeholder entry

const PLACEHOLDERS = ['change_me', 'your-', 'your_google', 'example', '...', 'your_api'];

// mayukh: increasing the LOC deliberately
// mayukh: if any of the ENV vars are empty/ non-existent return True - that you must error out 
// mayukh: the .some() method is a circuit-breaker that trips if one of items in the array is True
// mayukh: The some() returns true the very first time the callback function inside some() returns true.

function isBad(v) {
  if (!v || !v.trim()) return true;
  const low = v.toLowerCase();
  
  // mayukh: fuzzy matching: includes() is used for regex matching
  return PLACEHOLDERS.some( regexCheck => low.includes(regexCheck));
  
  // mayukh: exact matching: 
  // return PLACEHOLDERS.some(feed => { if (feed == low) { return true } });

}

// mayukh: understood, missing holds an array of missing ENV vars
// mayukh: the filter method checks for availability
// mayukh: using a return True in the callback of a forEach() only stops the execution of that item, proceeds gracefully from the next :)

const missing = REQUIRED.filter((k) => isBad(process.env[k]));

// mayukh: could also be if (missing.length) as a non-zero value is truthy

if (missing.length > 0) {
  console.error(`Missing/invalid env: ${missing.join(', ')}. Check root .env vs .env.example (Render: Dashboard > Environment).`);
  process.exit(1);
}

// mayukh: hmm JWT secrets must always be greater than or equal to 32 characters

if (process.env.JWT_SECRET.length < 32) {
  console.error('Missing/invalid env: JWT_SECRET must be >= 32 chars.');
  process.exit(1);
}

// mayukh: Render injects its own environment variables and Render injects PORT. Render does not care about SERVER_PORT.

module.exports = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  SERVER_PORT: process.env.SERVER_PORT || process.env.PORT || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5000',
};
