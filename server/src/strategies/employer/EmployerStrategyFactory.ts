import { IEmployerTypeStrategy } from './IEmployerTypeStrategy';
import { ManufacturingStrategy } from './ManufacturingStrategy';
import { HomeCareStrategy } from './HomeCareStrategy';
import { InstitutionStrategy } from './InstitutionStrategy';

/**
 * Factory for creating employer type strategies
 */
export class EmployerStrategyFactory {
    private static strategies: Map<string, IEmployerTypeStrategy> = new Map([
        ['MANUFACTURING', new ManufacturingStrategy()],
        ['HOME_CARE', new HomeCareStrategy()],
        ['HOME_HELPER', new HomeCareStrategy()], // Same as HOME_CARE
        ['INSTITUTION', new InstitutionStrategy()],
        ['NURSING_HOME', new InstitutionStrategy()], // Same as INSTITUTION
        ['AGRICULTURE_FARMING', new ManufacturingStrategy()], // Similar to manufacturing
        ['AGRICULTURE_OUTREACH', new ManufacturingStrategy()]
    ]);

    /**
     * Get strategy for employer category
     */
    static getStrategy(category: string): IEmployerTypeStrategy {
        const strategy = this.strategies.get(category);

        if (!strategy) {
            // Default to manufacturing strategy for unknown categories
            console.warn(`No strategy found for category: ${category}, using ManufacturingStrategy as default`);
            return new ManufacturingStrategy();
        }

        return strategy;
    }

    /**
     * Check if strategy exists for category
     */
    static hasStrategy(category: string): boolean {
        return this.strategies.has(category);
    }

    /**
     * Register a new strategy (for extensibility)
     */
    static registerStrategy(category: string, strategy: IEmployerTypeStrategy): void {
        this.strategies.set(category, strategy);
    }
}
