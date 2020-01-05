import React from 'react';
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
  background: #74d2ff;
  margin-top: 0.5rem;
  &:hover {
    opacity: 0.85;
  }
`;

const StyledPre = styled.pre<{ tagsLength: number; showBorder: boolean }>`
  display: ${props => (props.tagsLength ? 'flex' : 'none')};
  align-items: center;
  flex-wrap: wrap;
  border-top: ${props => (props.showBorder ? '1px solid #74d2ff' : 'none')};
  padding-top: 0.5rem;
`;

const StyledLabel = styled.label<{ showLabel: boolean }>`
  margin-top: 0.5rem;
  display: ${props => (props.showLabel ? 'flex' : 'none')};
`;

interface TagProps {
  tags: string[];
  style?: {
    showBorder: boolean;
    showLabel: boolean;
  };
}

const Tag = (props: TagProps) => {
  const { style = { showBorder: true, showLabel: true }, tags = [] } = props;
  return (
    <StyledPre showBorder={style.showBorder} tagsLength={tags.length}>
      <StyledLabel showLabel={style.showLabel}>标签：</StyledLabel>
      {/* TODO: 这里应该跳转到tag详情页，该页显示相关tag的article列表 */}
      {tags.map((tag: string) => (
        <StyledLink key={tag} to={`/tags/${tag}`}>
          {tag}
        </StyledLink>
      ))}
    </StyledPre>
  );
};

export default Tag;
