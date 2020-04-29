import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router';
import ErrorBoundary from 'react-error-boundary';

import { PageWrapper, PageContent, Heading2 } from '../../../shared/Styles';
import Loading from '../../common/Loading';
import SearchResult from '../../SearchResult';
import HomeText from '../../HomeText';
import SearchBar from './SearchBar';

import { tokenize } from '../../../shared/Util';
import {
  API_BASE,
  SEARCH_ENDPOINT,
  SEARCH_VERTICAL_OPTIONS,
  SearchVerticalOption,
} from '../../../shared/Constants';
import Filters from './Filters';
import { SearchArticle, SearchFilters, SelectedSearchFilters } from '../../../shared/Models';

const defaultFilter = {
  yearMinMax: [0, 0],
  authors: [],
  journals: [],
  sources: [],
};

const getSearchFilters = (searchResults: SearchArticle[] | null): SearchFilters => {
  if (searchResults === null || searchResults.length === 0) {
    return defaultFilter;
  }

  let min = Number.MAX_VALUE;
  let max = -1;
  let authors: Set<string> = new Set([]);
  let journals: Set<string> = new Set([]);
  let sources: Set<string> = new Set([]);

  searchResults.forEach((article) => {
    if (article.publish_time) {
      const year = Number(article.publish_time.substr(0, 4));
      min = Math.min(year, min);
      max = Math.max(year, max);
    }

    if (article.authors) {
      article.authors.forEach((a) => authors.add(a));
    }

    if (article.journal) {
      journals.add(article.journal);
    }

    if (article.source) {
      sources.add(article.source);
    }
  });

  return {
    yearMinMax: [min, max],
    authors: Array.from(authors.values()),
    journals: Array.from(journals.values()),
    sources: Array.from(sources.values()),
  };
};

const HomePage = () => {
  const urlParams = new URLSearchParams(useLocation().search);
  const query = urlParams.get('query') || '';
  const vertical = urlParams.get('vertical') || 'cord19';

  const [loading, setLoading] = useState<Boolean>(false);
  const [queryInputText, setQueryInputText] = useState<string>(query || '');
  const [selectedVertical, setSelectedVertical] = useState<SearchVerticalOption>(
    SEARCH_VERTICAL_OPTIONS[0],
  );

  const [filters, setFilters] = useState<SearchFilters>(defaultFilter);
  const [selectedFilters, setSelectedFilters] = useState<SelectedSearchFilters>({
    yearRange: [0, 0],
    authors: new Set([]),
    journals: new Set([]),
    sources: new Set([]),
  });

  const [queryId, setQueryId] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchArticle[] | null>(null);

  useEffect(() => {
    setQueryInputText(query);
  }, [query]);

  useEffect(() => {
    switch (vertical) {
      case 'cord19':
        setSelectedVertical(SEARCH_VERTICAL_OPTIONS[0]);
        break;
      case 'trialstreamer':
        setSelectedVertical(SEARCH_VERTICAL_OPTIONS[1]);
        break;
      default:
        setSelectedVertical(SEARCH_VERTICAL_OPTIONS[0]);
    }
  }, [vertical]);

  useEffect(() => {
    const fetchData = async () => {
      if (query === null || query === '') {
        setLoading(false);
        setSearchResults([]);
        return;
      }

      try {
        setLoading(true);
        setSearchResults(null);

        let response = await fetch(
          `${API_BASE}${SEARCH_ENDPOINT}?query=${query.toLowerCase()}&vertical=${vertical}`,
        );
        setLoading(false);

        let data = await response.json();
        setQueryId(data.query_id);

        const searchResults = data.response;
        const filters = getSearchFilters(searchResults);

        setSearchResults(searchResults);
        setSelectedFilters({
          yearRange: filters.yearMinMax,
          authors: new Set([]),
          journals: new Set([]),
          sources: new Set([]),
        });
        setFilters(filters);
      } catch {
        setLoading(false);
        setSearchResults([]);
      }
    };
    fetchData();
  }, [query, vertical]);

  const queryTokens = tokenize(query);
  const filteredResults =
    searchResults === null
      ? null
      : searchResults.filter(
          (article) =>
            (!article.publish_time ||
              (Number(article.publish_time.substr(0, 4)) >= selectedFilters.yearRange[0] &&
                Number(article.publish_time.substr(0, 4)) <= selectedFilters.yearRange[1])) &&
            (selectedFilters.authors.size === 0 ||
              article.authors.some((a) => selectedFilters.authors.has(a))) &&
            (selectedFilters.journals.size === 0 ||
              selectedFilters.journals.has(article.journal)) &&
            (selectedFilters.sources.size === 0 || selectedFilters.sources.has(article.source)),
        );

  return (
    <PageWrapper>
      <PageContent>
        <SearchBar
          query={queryInputText}
          vertical={selectedVertical}
          setQuery={setQueryInputText}
          setVertical={setSelectedVertical}
        />
        <ErrorBoundary FallbackComponent={() => <NoResults>No results found</NoResults>}>
          {loading && <Loading />}
          <HomeContent>
            {!query && <HomeText />}
            {query && searchResults !== null && searchResults.length > 0 && (
              <Filters
                filters={filters}
                selectedFilters={selectedFilters}
                setSelectedFilters={setSelectedFilters}
              />
            )}
            {query &&
              filteredResults !== null &&
              (searchResults === null || filteredResults.length === 0 ? (
                <NoResults>No results found</NoResults>
              ) : (
                <>
                  <SearchResults>
                    {filteredResults.map((article, i) => (
                      <SearchResult
                        key={i}
                        article={article}
                        position={i}
                        queryTokens={queryTokens}
                        queryId={queryId}
                      />
                    ))}
                  </SearchResults>
                </>
              ))}
          </HomeContent>
        </ErrorBoundary>
      </PageContent>
    </PageWrapper>
  );
};

export default HomePage;

const HomeContent = styled.div`
  width: 100%;
  margin-right: auto;
  display: flex;
`;

const NoResults = styled.div`
  ${Heading2}
  display: flex;
  margin-top: 16px;
  padding-bottom: 24px;
`;

const SearchResults = styled.div`
  display: flex;
  flex-direction: column;
`;
