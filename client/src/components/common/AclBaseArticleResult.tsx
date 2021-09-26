import React from 'react';
import styled from 'styled-components';

import { BaseAclArticle } from '../../shared/Models';
import { Heading3, Link } from '../../shared/Styles';

interface BaseArticleResultProps {
  article: BaseAclArticle;
  position?: number;
  onClickTitle?: () => void;
  boldTitle?: boolean;
}

const AclBaseArticleResult: React.FC<BaseArticleResultProps> = ({
  article,
  position,
  onClickTitle = () => {},
  boldTitle = false,
}) => {
  let authorString = '';
  if (article.author.length > 0) {
    article.author.forEach((author: String, idx: Number) => {
      if (author !== '') {
        authorString += idx === article.author.length - 1 ? `${author}.` : `${author}, `;
      }
    });
  }

  // generating the venue
  let venues = '';
  if (article.venues.length > 0) {
    article.venues.forEach((venue: String, idx: Number) => {
      venues += idx === article.venues.length - 1 ? `${venue}.` : `${venue}, `; 
    })
  }

  return (
    <>
      <Title bold={boldTitle}>
        {position !== undefined ? `${position + 1}. ` : ''}
        {article.url !== null && article.url !== '' ? (
          <Link href={article.url} target="_blank" rel="noopener noreferrer" onClick={onClickTitle}>
            {article.title}
          </Link>
        ) : (
          article.title
        )}
      </Title>
      <Subtitle>
        {authorString && <Authors>{authorString}</Authors>}
        {venues && <Journal>{venues}</Journal>}
        {article.sigs && <Journal>{article.sigs}</Journal>}
        {article.year && <PublishTime>({article.year})</PublishTime>}
      </Subtitle>
    </>
  );
};

export default AclBaseArticleResult;

const Title = styled.div<{ bold?: boolean }>`
  ${Heading3}
  margin-bottom: 16px;
  font-weight: ${({ bold }) => (bold ? 700 : 400)};
`;

const Subtitle = styled.div`
  font-size: 16px;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.black};
`;

const Authors = styled.span`
  margin-right: 4px;
`;

const Journal = styled.span`
  font-style: italic;
  margin-right: 4px;
`;

const PublishTime = styled.span``;
