import React, { useState, useEffect } from 'react'

// 根据环境设置API基础URL
const apiBaseUrl = import.meta.env.PROD ? '' : 'http://localhost:8080'

function App() {
  const [puzzleData, setPuzzleData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPuzzle = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/today`)
        if (!response.ok) {
          throw new Error(`API响应错误: ${response.status}`)
        }
        const data = await response.json()
        setPuzzleData(data)
      } catch (error) {
        console.error('加载谜题失败:', error)
        setError('无法加载谜题数据。请稍后再试。')
      } finally {
        setLoading(false)
      }
    }

    loadPuzzle()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>{error}</div>
  }

  return (
    <div>
      <h1>NYT Connections Helper</h1>
      {puzzleData ? (
        <div>
          <p>Today's puzzle data loaded successfully!</p>
          {/* Add more puzzle display logic here */}
        </div>
      ) : (
        <p>Welcome to NYT Connections Helper!</p>
      )}
    </div>
  )
}

export default App 