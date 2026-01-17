// Environment validation script for AgencyOS deployment
const fs = require("fs");
const path = require("path");

const requiredEnvVars = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: {
    required: true,
    pattern: /^https:\/\/[a-zA-Z0-9.-]+\.supabase\.co$/,
    description: "Supabase project URL",
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    required: true,
    pattern: /^[a-zA-Z0-9._-]+$/,
    description: "Supabase anonymous key",
  },

  // Polar
  POLAR_ACCESS_TOKEN: {
    required: true,
    pattern: /^pol_[a-zA-Z0-9]+$/,
    description: "Polar access token",
  },
  POLAR_PRO_PRODUCT_ID: {
    required: true,
    pattern: /^[a-zA-Z0-9_-]+$/,
    description: "Polar Pro product ID",
  },
  POLAR_ENTERPRISE_PRODUCT_ID: {
    required: true,
    pattern: /^[a-zA-Z0-9_-]+$/,
    description: "Polar Enterprise product ID",
  },

  // Optional but recommended
  REDIS_URL: {
    required: false,
    pattern: /^redis:\/\/[a-zA-Z0-9.-]+:[0-9]+$/,
    description: "Redis connection URL",
  },
  DATABASE_URL: {
    required: false,
    pattern: /^postgresql:\/\/[a-zA-Z0-9.-]+:[0-9]+\/[a-zA-Z0-9_-]+$/,
    description: "PostgreSQL connection URL",
  },
};

function validateEnvironment(envFile = ".env.production") {
  console.log(`🔍 Validating ${envFile}...`);

  if (!fs.existsSync(envFile)) {
    console.error(`❌ ${envFile} not found`);
    return false;
  }

  const envContent = fs.readFileSync(envFile, "utf8");
  const envVars = {};

  // Parse .env file
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1]] = match[2];
    }
  });

  let isValid = true;
  const warnings = [];

  // Check each required variable
  Object.entries(requiredEnvVars).forEach(([key, config]) => {
    const value = envVars[key];

    if (config.required && !value) {
      console.error(`❌ Missing required: ${key} - ${config.description}`);
      isValid = false;
      return;
    }

    if (!config.required && !value) {
      warnings.push(`⚠️  Optional: ${key} - ${config.description}`);
      return;
    }

    if (value && config.pattern && !config.pattern.test(value)) {
      console.error(
        `❌ Invalid format: ${key} - Expected pattern: ${config.pattern}`,
      );
      isValid = false;
      return;
    }

    if (value) {
      console.log(`✅ ${key}: Valid`);
    }
  });

  // Show warnings
  if (warnings.length > 0) {
    console.log("\n⚠️  Optional variables missing:");
    warnings.forEach((warning) => console.log(warning));
  }

  if (isValid) {
    console.log(`\n✅ ${envFile} validation passed`);
  } else {
    console.log(`\n❌ ${envFile} validation failed`);
  }

  return isValid;
}

function main() {
  const envFile = process.argv[2] || ".env.production";
  const isValid = validateEnvironment(envFile);

  if (!isValid) {
    console.log("\n📋 Environment setup guide:");
    console.log(
      "1. Copy template: cp .env.production.template .env.production",
    );
    console.log("2. Fill in required values");
    console.log("3. Run validation again");
    process.exit(1);
  }

  console.log("\n🚀 Environment ready for deployment!");
}

if (require.main === module) {
  main();
}

module.exports = { validateEnvironment };
