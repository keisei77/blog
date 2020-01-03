/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from 'react';
import { useStaticQuery, graphql } from 'gatsby';
import Tag from './tag';

const Tags = () => {
  const data = useStaticQuery(graphql`
    query {
      allMarkdownRemark {
        nodes {
          frontmatter {
            tags
          }
          fields {
            slug
          }
        }
      }
    }
  `);

  const posts = data.allMarkdownRemark.nodes;
  const tagsSet = new Set<string>();
  posts.forEach(({ frontmatter, fields }: any) => {
    const { tags } = frontmatter;
    tags.forEach((tag: string) => {
      tagsSet.add(tag);
    });
  });
  const tagStyle = {
    showBorder: false,
    showLabel: false,
  };
  const uniqueTags = Array.from(tagsSet);
  return <Tag style={tagStyle} tags={uniqueTags} />;
};

export default Tags;
