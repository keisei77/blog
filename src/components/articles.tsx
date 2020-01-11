/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from 'react';
import { useStaticQuery, graphql, Link } from 'gatsby';

const Articles = (props: any) => {
  const { posts } = props;

  return posts.map(({ node }: { node: any }) => {
    const title = node.frontmatter.title || node.fields.slug;
    return (
      <article style={{ margin: '10px 0' }} key={node.fields.slug}>
        <header>
          <h3
            style={{
              margin: 0,
            }}
          >
            <Link style={{ boxShadow: `none` }} to={node.fields.slug}>
              {title}
            </Link>
          </h3>
          <small>{node.frontmatter.date}</small>
        </header>
        <section>
          <p
            style={{
              margin: 0,
            }}
            dangerouslySetInnerHTML={{
              __html: node.frontmatter.description || node.excerpt,
            }}
          />
        </section>
      </article>
    );
  });
};

export default Articles;
