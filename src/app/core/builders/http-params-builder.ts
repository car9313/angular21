import { HttpParams } from '@angular/common/http';
import { QueryParams, Filter, Sort } from '../interfaces/query-params';

/**
 * Chainable builder that maps the application QueryParams into the
 * HttpParams shape expected by the .NET backend.
 */
export class HttpParamsBuilder {
    private params = new HttpParams();

    /**
     * Sets Pag.Page and Pag.PageSize.
     */
    withPagination(page?: number, size?: number): this {
        if (page != null) {
            this.params = this.params.set('Pag.Page', page.toString());
        }
        if (size != null) {
            this.params = this.params.set('Pag.PageSize', size.toString());
        }
        return this;
    }

    /**
     * Sets Search.SearchText (trimmed) and Search.Strict.
     * Omitted entirely when the trimmed text is empty.
     */
    withSearch(text?: string, strict = false): this {
        const trimmed = text?.trim();
        if (trimmed) {
            this.params = this.params.set('Search.SearchText', trimmed);
            this.params = this.params.set('Search.Strict', strict.toString());
        }
        return this;
    }

    /**
     * Serializes filters into the single Filter param as JSON.
     * Omitted when the list is empty.
     */
    withFilters(filters?: Filter[]): this {
        if (filters?.length) {
            this.params = this.params.set('Filter', JSON.stringify(filters));
        }
        return this;
    }

    /**
     * Sets Sort[i].SortBy and Sort[i].Ascending for every sort entry.
     */
    withSort(sort?: Sort[]): this {
        sort?.forEach((entry, index) => {
            this.params = this.params.set(`Sort[${index}].SortBy`, entry.SortBy);
            this.params = this.params.set(`Sort[${index}].Ascending`, entry.Ascending.toString());
        });
        return this;
    }

    /**
     * Applies every slice of a full QueryParams object.
     */
    withQueryParams(query: QueryParams): this {
        this.withPagination(query.pag.Page, query.pag.PageSize);
        this.withSearch(query.search.SearchText, query.search.Strict);
        this.withFilters(query.filter);
        this.withSort(query.sort);
        return this;
    }

    build(): HttpParams {
        return this.params;
    }

    /**
     * Convenience: builds HttpParams from a complete QueryParams in one step.
     */
    static fromQuery(query: QueryParams): HttpParams {
        return new HttpParamsBuilder().withQueryParams(query).build();
    }
}
