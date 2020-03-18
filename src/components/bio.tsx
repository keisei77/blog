/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from 'react';
import certificate1 from '../assets/20200318195904.jpg';
import certificate2 from '../assets/20200318195855.jpg';
import { useStaticQuery, graphql } from 'gatsby';

const Bio = () => {
  const data = useStaticQuery(graphql`
    query BioQuery {
      site {
        siteMetadata {
          author
          social {
            email
            github
          }
        }
      }
    }
  `);

  const { author, social } = data.site.siteMetadata;
  const { email, github } = social;
  return (
    <div
      style={{
        paddingTop: '1rem',
      }}
    >
      <div
        style={{
          paddingBottom: '10px',
        }}
      >
        前端开发者一枚，喜欢看电影，游戏，篮球，更喜欢写代码。偶尔做做公益，参加一些技术沙龙，学习新技术。
      </div>
      <div
        style={{
          paddingBottom: '10px',
        }}
      >
        <a href={`mailto:${email}`}>{email}</a>
      </div>
      <div>
        <a href={github} target="_blank" rel="noopener noreferrer">
          {github}
        </a>
      </div>
      <div
        style={{
          textAlign: 'center',
          padding: '20px',
        }}
      >
        <img
          style={{
            maxWidth: '300px',
            paddingBottom: '10px',
          }}
          src={certificate1}
          alt="证书"
        />
        <img
          style={{
            maxWidth: '300px',
          }}
          src={certificate2}
          alt="证书"
        />
      </div>
    </div>
  );
};

export default Bio;
