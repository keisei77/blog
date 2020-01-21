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

interface TagWrapper {
  label: string;
  count: number;
}

interface TagProps {
  tags: TagWrapper[] | string[];
  style?: {
    showBorder: boolean;
    showLabel: boolean;
  };
}

const Tag = (props: TagProps) => {
  const { style = { showBorder: true, showLabel: true }, tags = [] } = props;
  (tags as any).sort((a: TagWrapper | string, b: TagWrapper | string) => {
    let labelA = null;
    let labelB = null;
    if (typeof a === 'string' && typeof b === 'string') {
      labelA = a;
      labelB = b;
    } else {
      labelA = (a as TagWrapper).label;
      labelB = (b as TagWrapper).label;
    }

    return labelA.toLowerCase() < labelB.toLowerCase() && -1;
  });
  return (
    <StyledPre showBorder={style.showBorder} tagsLength={tags.length}>
      <StyledLabel showLabel={style.showLabel}>标签：</StyledLabel>
      {(tags as any).map((tag: TagWrapper | string) => {
        let label = null;
        let count = null;
        if (typeof tag === 'string') {
          label = tag;
        } else {
          label = tag.label;
          count = tag.count;
        }

        return (
          <StyledLink key={label} to={`/tags/${label}`}>
            {label}
            {count && ` (${count})`}
          </StyledLink>
        );
      })}
    </StyledPre>
  );
};

export default Tag;
