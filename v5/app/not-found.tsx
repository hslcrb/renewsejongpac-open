import Link from "next/link";
import { SystemText } from "../components/SystemText";
import SystemSurface from "../components/SystemSurface";
import { SystemLink } from "../components/SystemPrimitives";

// [오류 화면에도 같은 글자와 표면 규격 / The same text and surface contract on error pages]
export default function NotFound() {
    return <div className="container page-layout">
        <nav data-text="body" className="page-layout-breadcrumbs" aria-label="현재 위치"><Link data-text="action" href="/">홈</Link></nav>
        <SystemSurface as="section" padding="lg">
            <SystemText as="p" variant="display">404</SystemText>
            <SystemText as="h1" variant="heading">페이지를 찾을 수 없습니다</SystemText>
            <SystemText as="p" variant="body">주소를 확인하거나 프로그램 목록에서 다시 찾아 주세요.</SystemText>
            <SystemLink href="/programs/">프로그램 보기</SystemLink>
        </SystemSurface>
    </div>;
}
