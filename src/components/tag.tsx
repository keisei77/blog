import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Link } from 'gatsby';
import styled from 'styled-components';

const StyledLink = styled(Link)`
  text-align: center;
  color: #fff;
  margin-right: 0.5rem;
  padding: 0.25rem 0.5rem;
  display: inline-block;
  border-radius: 0.875rem;
  height: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1rem;
  transition: opacity 0.1s ease-in-out;
  background: #a1c4fd;
  &:hover {
    opacity: 0.85;
  }
`;

const StyledPre = styled.pre<{ tagsLength: number }>`
  display: ${props => (props.tagsLength ? 'flex' : 'none')};
  align-items: center;
  border-top: 1px solid #a1c4fd;
  padding-top: 1rem;
`;

interface TagProps {
  slug: string;
  tags: string[];
}

const Tag = (props: TagProps) => {
  const { slug, tags = [] } = props;
  return (
    <StyledPre tagsLength={tags.length}>
      <span>标签：</span>
      {/* TODO: 这里应该跳转到tag详情页，该页显示相关tag的article列表 */}
      {tags.map((tag: string) => (
        <StyledLink to={slug}>{tag}</StyledLink>
      ))}
    </StyledPre>
  );
};

export default Tag;
