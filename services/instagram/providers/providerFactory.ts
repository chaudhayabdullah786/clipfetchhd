import { InstagramExtractionProvider } from "./provider.js";
import { ExternalInstagramProvider } from "./externalProvider.js";
import { DirectInstagramProvider } from "./directProvider.js";

export class ProviderFactory {
  /**
   * Returns the prioritized list of extraction providers.
   * Priority:
   * 1. External API provider (if configured or explicitly requested)
   * 2. Direct public metadata extraction
   */
  public static getProviders(): InstagramExtractionProvider[] {
    const providers: InstagramExtractionProvider[] = [];
    const providerConfig = (process.env.INSTAGRAM_PROVIDER || "").toLowerCase().trim();

    const external = new ExternalInstagramProvider();
    const direct = new DirectInstagramProvider();

    if (providerConfig === "external") {
      // Explicitly requested external only or first
      providers.push(external);
      providers.push(direct);
    } else if (providerConfig === "direct") {
      // Explicitly requested direct only
      providers.push(direct);
    } else {
      // Default: If external has URL/Key configured, prioritize external, otherwise fallback to direct
      if (external.isConfigured()) {
        providers.push(external);
      }
      providers.push(direct);
    }

    return providers;
  }

  /**
   * Returns provider status for diagnostics & health check.
   */
  public static getStatus(): {
    configured: boolean;
    provider: string;
    hasExternal: boolean;
    hasDirect: boolean;
  } {
    const providerConfig = (process.env.INSTAGRAM_PROVIDER || "").toLowerCase().trim();
    const external = new ExternalInstagramProvider();
    const direct = new DirectInstagramProvider();

    const isExternalConfigured = external.isConfigured();
    const chosenProvider = providerConfig || (isExternalConfigured ? "external" : "direct");

    return {
      configured: chosenProvider === "direct" || (chosenProvider === "external" && isExternalConfigured),
      provider: chosenProvider,
      hasExternal: isExternalConfigured,
      hasDirect: true
    };
  }
}
