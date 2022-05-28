import React from 'react';
import Layout from '../components/layout';
import SEO from '../components/seo';

const FRIENDS = [
  {
    url: 'https://kalasearch.cn/',
    title: '卡拉搜索',
    desc: '',
  },
  {
    url: 'https://kalacloud.com/',
    title: '卡拉云低代码工具',
    desc: '',
  }
];

const Friends = () => (
  <Layout>
    <>
      <SEO title="Keisei's Blog" />
      <div
        style={{
          paddingTop: '1rem',
        }}
      >
        {FRIENDS.map(item => {
          return (
            <div
              key={item.url}
              style={{
                paddingBottom: '10px',
              }}
            >
              <a rel="noopener noreferrer" target="_blank" href={item.url}>
                {item.title}
              </a>
              <p
                style={{
                  fontSize: '12px',
                }}
              >
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>
    </>
  </Layout>
);

export default Friends;
